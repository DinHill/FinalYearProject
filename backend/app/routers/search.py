"""
Global search endpoints
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import verify_firebase_token
from app.models import User, Course, Enrollment, Document, Announcement, Major
from app.models.academic import CourseSection
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["Search"])


# ============================================================================
# Global Search
# ============================================================================

@router.get(
    "/global",
    summary="Global search across multiple entities",
    description="Search across users, courses, documents, announcements, and more"
)
async def global_search(
    q: str = Query(..., min_length=1, description="Search query"),
    entity_types: Optional[List[str]] = Query(
        None,
        description="Filter by entity types: users, courses, enrollments, documents, announcements, majors, sections"
    ),
    limit: int = Query(5, ge=1, le=50, description="Results per entity type"),
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Perform global search across multiple entity types
    
    Returns results grouped by entity type with relevant fields
    """
    search_term = f"%{q}%"
    results = {
        "query": q,
        "results": {}
    }
    
    # Default to all entity types if not specified
    if not entity_types:
        entity_types = ["users", "courses", "documents", "announcements", "majors"]
    
    # Search Users
    if "users" in entity_types:
        user_query = select(User).where(
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term),
                User.username.ilike(search_term),
                User.phone_number.ilike(search_term)
            )
        ).limit(limit)
        
        user_results = await db.execute(user_query)
        users = user_results.scalars().all()
        
        results["results"]["users"] = [
            {
                "id": user.id,
                "type": "user",
                "title": user.full_name,
                "subtitle": f"{user.email} • {user.role}",
                "description": f"Username: {user.username}",
                "url": f"/users/{user.id}",
                "metadata": {
                    "role": user.role,
                    "email": user.email,
                    "status": user.status
                }
            }
            for user in users
        ]
    
    # Search Courses
    if "courses" in entity_types:
        course_query = select(Course).options(
            selectinload(Course.major)
        ).where(
            or_(
                Course.name.ilike(search_term),
                Course.course_code.ilike(search_term),
                Course.description.ilike(search_term)
            )
        ).limit(limit)

        course_results = await db.execute(course_query)
        courses = course_results.scalars().all()

        results["results"]["courses"] = [
            {
                "id": getattr(course, "id", None),
                "type": "course",
                "title": getattr(course, "name", None),
                "subtitle": f"{getattr(course, 'course_code', '')} • {getattr(course, 'credits', '')} credits",
                "description": (course.description[:100] + "...") if getattr(course, "description", None) and len(course.description) > 100 else getattr(course, "description", None),
                "url": f"/academics?course_id={getattr(course, 'id', '')}",
                "metadata": {
                    "code": getattr(course, "course_code", None),
                    "credits": getattr(course, "credits", None),
                    "major": getattr(course.major, "name", None) if getattr(course, "major", None) else None,
                    "is_active": getattr(course, "is_active", None)
                }
            }
            for course in courses
        ]
    
    # Search Enrollments
    if "enrollments" in entity_types:
        # Use explicit column access and safe attribute reads to avoid serializing ORM objects
        enrollment_query = select(Enrollment).options(
            selectinload(Enrollment.student),
            selectinload(Enrollment.section).selectinload(CourseSection.course)
        ).join(User, Enrollment.student_id == User.id).join(
            CourseSection, Enrollment.course_section_id == CourseSection.id
        ).join(Course, CourseSection.course_id == Course.id).where(
            or_(
                User.full_name.ilike(search_term),
                User.username.ilike(search_term),
                Course.name.ilike(search_term),
                Course.course_code.ilike(search_term)
            )
        ).limit(limit)

        enrollment_results = await db.execute(enrollment_query)
        enrollments = enrollment_results.scalars().all()

        results["results"]["enrollments"] = [
            {
                "id": getattr(enrollment, "id", None),
                "type": "enrollment",
                "title": f"{getattr(enrollment.student, 'full_name', '')} - {getattr(getattr(enrollment.section, 'course', None), 'name', '')}",
                "subtitle": f"{getattr(getattr(enrollment.section, 'course', None), 'course_code', '')} • {getattr(enrollment, 'status', '')}",
                "description": f"Section {getattr(enrollment.section, 'section_code', '')}",
                "url": f"/enrollments?enrollment_id={getattr(enrollment, 'id', '')}",
                "metadata": {
                    "student_name": getattr(enrollment.student, 'full_name', None),
                    "course_name": getattr(getattr(enrollment.section, 'course', None), 'name', None),
                    "course_code": getattr(getattr(enrollment.section, 'course', None), 'course_code', None),
                    "status": getattr(enrollment, 'status', None),
                    "semester": None
                }
            }
            for enrollment in enrollments
        ]
    
    # Search Documents
    if "documents" in entity_types:
        document_query = select(Document).options(selectinload(Document.user)).where(Document.title.ilike(search_term)).limit(limit)

        document_results = await db.execute(document_query)
        documents = document_results.scalars().all()

        results["results"]["documents"] = [
            {
                "id": getattr(doc, 'id', None),
                "type": "document",
                "title": getattr(doc, 'title', None),
                "subtitle": f"{getattr(getattr(doc, 'document_type', None), 'name', 'Document')} • {getattr(doc, 'status', None)}",
                "description": (doc.description[:100] + "...") if getattr(doc, 'description', None) and len(doc.description) > 100 else getattr(doc, 'description', None),
                "url": f"/documents/{getattr(doc, 'id', '')}",
                "metadata": {
                    "status": getattr(doc, 'status', None),
                    "student_name": getattr(getattr(doc, 'student', None), 'full_name', None),
                    "type": getattr(getattr(doc, 'document_type', None), 'name', None)
                }
            }
            for doc in documents
        ]
    
    # Search Announcements
    if "announcements" in entity_types:
        announcement_query = select(Announcement).options(
            selectinload(Announcement.author)
        ).where(
            and_(
                Announcement.is_published == True,  # Only search published
                or_(
                    Announcement.title.ilike(search_term),
                    Announcement.content.ilike(search_term)
                )
            )
        ).limit(limit)

        announcement_results = await db.execute(announcement_query)
        announcements = announcement_results.scalars().all()

        results["results"]["announcements"] = [
            {
                "id": getattr(ann, 'id', None),
                "type": "announcement",
                "title": getattr(ann, 'title', None),
                "subtitle": f"By {getattr(getattr(ann, 'author', None), 'full_name', 'Unknown')} • {getattr(ann, 'target_audience', None)}",
                "description": (ann.content[:100] + "...") if getattr(ann, 'content', None) and len(ann.content) > 100 else getattr(ann, 'content', None),
                "url": f"/announcements/{getattr(ann, 'id', '')}",
                "metadata": {
                    "author": getattr(getattr(ann, 'author', None), 'full_name', None),
                    "audience": getattr(ann, 'target_audience', None),
                    "published_at": getattr(ann, 'published_at', None).isoformat() if getattr(ann, 'published_at', None) else None
                }
            }
            for ann in announcements
        ]
    
    # Search Majors/Programs
    if "majors" in entity_types:
        major_query = select(Major).where(
            or_(
                Major.name.ilike(search_term),
                Major.code.ilike(search_term),
                Major.description.ilike(search_term)
            )
        ).limit(limit)

        major_results = await db.execute(major_query)
        majors = major_results.scalars().all()

        results["results"]["majors"] = [
            {
                "id": getattr(major, 'id', None),
                "type": "major",
                "title": getattr(major, 'name', None),
                "subtitle": f"{getattr(major, 'code', '')} • {getattr(major, 'degree_level', '')}",
                "description": (major.description[:100] + "...") if getattr(major, 'description', None) and len(major.description) > 100 else getattr(major, 'description', None),
                "url": f"/academics/programs/{getattr(major, 'id', '')}",
                "metadata": {
                    "code": getattr(major, 'code', None),
                    "degree_level": getattr(major, 'degree_level', None),
                    "duration_years": getattr(major, 'duration_years', None)
                }
            }
            for major in majors
        ]
    
    # Search Sections
    if "sections" in entity_types:
        section_query = select(CourseSection).options(
            selectinload(CourseSection.course),
            selectinload(CourseSection.instructor)
        ).join(Course, CourseSection.course_id == Course.id).where(
            or_(
                Course.name.ilike(search_term),
                Course.course_code.ilike(search_term),
                CourseSection.section_code.ilike(search_term)
            )
        ).limit(limit)

        section_results = await db.execute(section_query)
        sections = section_results.scalars().all()

        results["results"]["sections"] = []
        for section in sections:
            instructor = getattr(section, 'instructor', None)
            results["results"]["sections"].append({
                "id": getattr(section, 'id', None),
                "type": "section",
                "title": f"{getattr(getattr(section, 'course', None), 'name', '')} - Section {getattr(section, 'section_code', '')}",
                "subtitle": f"{getattr(getattr(section, 'course', None), 'course_code', '')} • {getattr(instructor, 'full_name', 'No teacher')}",
                "description": f"{getattr(section, 'schedule', None)} • {getattr(section, 'room', None)}",
                "url": f"/academics/sections/{getattr(section, 'id', '')}",
                "metadata": {
                    "course_code": getattr(getattr(section, 'course', None), 'course_code', None),
                    "section_number": getattr(section, 'section_code', None),
                    "teacher": getattr(instructor, 'full_name', None),
                    "schedule": getattr(section, 'schedule', None),
                    "capacity": getattr(section, 'max_students', None)
                }
            })
    
    # Add result counts
    results["counts"] = {
        entity_type: len(results["results"].get(entity_type, []))
        for entity_type in entity_types
    }
    results["total_results"] = sum(results["counts"].values())
    
    return results


# ============================================================================
# Search Suggestions / Autocomplete
# ============================================================================

@router.get(
    "/suggestions",
    summary="Get search suggestions",
    description="Get autocomplete suggestions based on partial query"
)
async def search_suggestions(
    q: str = Query(..., min_length=1, description="Partial search query"),
    limit: int = Query(10, ge=1, le=20),
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get autocomplete suggestions for search
    
    Returns quick suggestions from users, courses, and documents
    """
    search_term = f"{q}%"  # Prefix match for autocomplete
    suggestions = []
    
    # User suggestions (names and usernames)
    user_query = select(User.full_name, User.username, User.role).where(
        or_(
            User.full_name.ilike(search_term),
            User.username.ilike(search_term)
        )
    ).limit(5)
    
    user_results = await db.execute(user_query)
    for full_name, username, role in user_results:
        suggestions.append({
            "text": full_name,
            "type": "user",
            "icon": "user",
            "subtitle": f"@{username} • {role}"
        })
    
    # Course suggestions
    course_query = select(Course.name, Course.course_code).where(
        or_(
            Course.name.ilike(search_term),
            Course.course_code.ilike(search_term)
        )
    ).limit(5)
    
    course_results = await db.execute(course_query)
    for name, code in course_results:
        suggestions.append({
            "text": name,
            "type": "course",
            "icon": "book",
            "subtitle": code
        })
    
    return {
        "query": q,
        "suggestions": suggestions[:limit]
    }




