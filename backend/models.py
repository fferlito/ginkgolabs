"""User-owned places and observations. Clerk user id is the tenant key."""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class User(Base):
    __tablename__ = "users"

    clerk_user_id: Mapped[str] = mapped_column(Text, primary_key=True)
    email: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Place(Base):
    __tablename__ = "places"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    clerk_user_id: Mapped[str] = mapped_column(Text, ForeignKey("users.clerk_user_id"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Observation(Base):
    __tablename__ = "observations"
    __table_args__ = (
        Index("ix_observations_user_date", "clerk_user_id", "observed_on"),
        Index("ix_observations_public_date", "is_public", "observed_on"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    clerk_user_id: Mapped[str] = mapped_column(Text, ForeignKey("users.clerk_user_id"), nullable=False)
    species_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    species_name: Mapped[str] = mapped_column(Text, nullable=False)
    scientific_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    observed_on: Mapped[date] = mapped_column(Date, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_object: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(16), nullable=False, default="manual")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
