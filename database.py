from sqlalchemy import create_engine, Integer, Float, Text, Date, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# PostgreSQL connection
DATABASE_URL = (
    "postgresql+psycopg://postgres:Vaibhavsp2004@localhost:5432/motobase"
    #"postgresql+psycopg://postgres:mypassword@localhost:5432/motobase"
)


# Base class for SQLAlchemy models
class Base(DeclarativeBase):
    pass


class Motorcycle(Base):
    __tablename__ = "motorcycles"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    brand: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str] = mapped_column(Text, nullable=False)
    variant: Mapped[str] = mapped_column(Text)

    body_type: Mapped[str] = mapped_column(Text)
    fuel_type: Mapped[str] = mapped_column(Text)
    segment_group: Mapped[str] = mapped_column(Text)

    ex_showroom_price_inr: Mapped[int] = mapped_column(Integer)

    engine_cc_or_battery_kwh: Mapped[float] = mapped_column(Float)
    power_bhp_or_kw: Mapped[float] = mapped_column(Float)
    torque_nm: Mapped[float] = mapped_column(Float)
    mileage_kmpl_or_range_km: Mapped[float] = mapped_column(Float)

    top_speed_kmph: Mapped[int] = mapped_column(Integer)

    transmission: Mapped[str] = mapped_column(Text)

    kerb_weight_kg: Mapped[float] = mapped_column(Float)
    seat_height_mm: Mapped[int] = mapped_column(Integer)
    ground_clearance_mm: Mapped[int] = mapped_column(Integer)

    fuel_tank_l_or_charge_time_hrs: Mapped[str] = mapped_column(Text)
    under_seat_storage_l: Mapped[str] = mapped_column(Text)

    wheelbase_mm: Mapped[int] = mapped_column(Integer)

    braking_front: Mapped[str] = mapped_column(Text)
    braking_rear: Mapped[str] = mapped_column(Text)
    abs_channels: Mapped[str] = mapped_column(Text)

    suspension_front: Mapped[str] = mapped_column(Text)
    suspension_rear: Mapped[str] = mapped_column(Text)

    digital_cluster_yn: Mapped[str] = mapped_column(Text)
    bluetooth_yn: Mapped[str] = mapped_column(Text)
    keyless_start_yn: Mapped[str] = mapped_column(Text)
    usb_charging_yn: Mapped[str] = mapped_column(Text)
    led_lighting_yn: Mapped[str] = mapped_column(Text)

    warranty: Mapped[str] = mapped_column(Text)

    source_urls: Mapped[str] = mapped_column(Text)

    confidence: Mapped[str] = mapped_column(Text)

    last_verified_date: Mapped[str] = mapped_column(Text)

    nr_field_count: Mapped[int] = mapped_column(Integer)

from sqlalchemy import ForeignKey, DateTime
from datetime import datetime


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    motorcycle_id: Mapped[int] = mapped_column(
        ForeignKey("motorcycles.id"),
        nullable=False
    )

    youtube_video_id: Mapped[str] = mapped_column(
        Text,
        unique=True,
        nullable=False
    )

    youtube_url: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    title: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    channel: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    transcript_status: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="pending"
    )

    transcript_path: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


# Create database engine
engine = create_engine(
    DATABASE_URL,
    echo=True
)

if __name__ == "__main__":
    with engine.connect() as connection:
        print("Successfully connected to PostgreSQL!")