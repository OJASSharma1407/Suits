"""SavedFile repository - database operations for saved files and research notes."""

import uuid
from sqlalchemy import select, delete, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.saved_file import SavedFile


class SavedFileRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_user_files(
        self,
        user_id: uuid.UUID,
        search_query: str | None = None,
        tag: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[SavedFile]:
        query = select(SavedFile).where(SavedFile.user_id == user_id)

        if search_query:
            pattern = f"%{search_query}%"
            query = query.where(
                or_(
                    SavedFile.case_title.ilike(pattern),
                    SavedFile.cnr.ilike(pattern),
                    SavedFile.court_name.ilike(pattern),
                    SavedFile.notes.ilike(pattern),
                )
            )

        query = query.order_by(SavedFile.updated_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        files = list(result.scalars().all())

        if tag:
            # Filter in Python for JSON tag containment
            files = [f for f in files if f.tags and tag in f.tags]

        return files

    async def get_by_id(self, user_id: uuid.UUID, file_id: uuid.UUID) -> SavedFile | None:
        result = await self.db.execute(
            select(SavedFile).where(SavedFile.user_id == user_id, SavedFile.id == file_id)
        )
        return result.scalar_one_or_none()

    async def get_by_cnr_filename(
        self, user_id: uuid.UUID, cnr: str, filename: str
    ) -> SavedFile | None:
        result = await self.db.execute(
            select(SavedFile).where(
                SavedFile.user_id == user_id,
                SavedFile.cnr == cnr,
                SavedFile.filename == filename,
            )
        )
        return result.scalar_one_or_none()

    async def save_or_update(
        self,
        user_id: uuid.UUID,
        cnr: str,
        filename: str,
        case_title: str,
        court_name: str,
        order_date: str,
        notes: str = "",
        highlights: list | None = None,
        tags: list | None = None,
    ) -> SavedFile:
        existing = await self.get_by_cnr_filename(user_id, cnr, filename)
        if existing:
            existing.case_title = case_title
            existing.court_name = court_name
            existing.order_date = order_date
            existing.notes = notes
            if highlights is not None:
                existing.highlights = highlights
            if tags is not None:
                existing.tags = tags
            await self.db.flush()
            return existing
        else:
            new_file = SavedFile(
                user_id=user_id,
                cnr=cnr,
                filename=filename,
                case_title=case_title,
                court_name=court_name,
                order_date=order_date,
                notes=notes,
                highlights=highlights or [],
                tags=tags or [],
            )
            self.db.add(new_file)
            await self.db.flush()
            return new_file

    async def update(
        self,
        user_id: uuid.UUID,
        file_id: uuid.UUID,
        notes: str | None = None,
        highlights: list | None = None,
        tags: list | None = None,
        case_title: str | None = None,
        court_name: str | None = None,
        order_date: str | None = None,
    ) -> SavedFile | None:
        saved_file = await self.get_by_id(user_id, file_id)
        if not saved_file:
            return None

        if notes is not None:
            saved_file.notes = notes
        if highlights is not None:
            saved_file.highlights = highlights
        if tags is not None:
            saved_file.tags = tags
        if case_title is not None:
            saved_file.case_title = case_title
        if court_name is not None:
            saved_file.court_name = court_name
        if order_date is not None:
            saved_file.order_date = order_date

        await self.db.flush()
        return saved_file

    async def delete(self, user_id: uuid.UUID, file_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            delete(SavedFile).where(SavedFile.user_id == user_id, SavedFile.id == file_id)
        )
        return result.rowcount > 0

    async def delete_by_cnr_filename(
        self, user_id: uuid.UUID, cnr: str, filename: str
    ) -> bool:
        result = await self.db.execute(
            delete(SavedFile).where(
                SavedFile.user_id == user_id,
                SavedFile.cnr == cnr,
                SavedFile.filename == filename,
            )
        )
        return result.rowcount > 0
