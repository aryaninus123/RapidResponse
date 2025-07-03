from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Enum, func, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from uuid import uuid4

Base = declarative_base()

class EmergencyStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    RESOLVED = "RESOLVED"
    CANCELLED = "CANCELLED"

class PriorityLevel(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class ServiceStatus(str, enum.Enum):
    ACTIVE = "active"
    LIMITED = "limited"
    INACTIVE = "inactive"

class UserRole(str, enum.Enum):
    PUBLIC = "public"
    DISPATCHER = "dispatcher"
    ADMIN = "admin"

class Emergency(Base):
    __tablename__ = "emergencies"

    id = Column(UUID, primary_key=True, default=uuid4)
    emergency_type = Column(String, nullable=False)
    priority_level = Column(String, nullable=False)
    status = Column(String, nullable=False)
    location_lat = Column(Float)
    location_lon = Column(Float)
    response_plan = Column(JSON)
    context_data = Column(JSON)  # Store weather, traffic, and other context data
    estimated_response_time = Column(DateTime)
    actual_response_time = Column(DateTime)
    notes = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    notifications = relationship("Notification", back_populates="emergency")
    status_updates = relationship("EmergencyStatusUpdate", back_populates="emergency")

class EmergencyStatusUpdate(Base):
    __tablename__ = "emergency_status_updates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    emergency_id = Column(UUID(as_uuid=True), ForeignKey("emergencies.id"))
    old_status = Column(Enum(EmergencyStatus))
    new_status = Column(Enum(EmergencyStatus))
    notes = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    emergency = relationship("Emergency", back_populates="status_updates")

class ServiceAvailability(Base):
    __tablename__ = "service_availability"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_type = Column(String, nullable=False)
    status = Column(Enum(ServiceStatus), default=ServiceStatus.ACTIVE)
    available_units = Column(Integer, default=0)
    average_response_time = Column(Integer)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    emergency_id = Column(UUID(as_uuid=True), ForeignKey("emergencies.id"))
    recipient_type = Column(String, nullable=False)  # service, user, admin
    recipient_id = Column(String, nullable=False)
    message = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, sent, delivered, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime)
    delivered_at = Column(DateTime)

    # Relationships
    emergency = relationship("Emergency", back_populates="notifications")

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    badge_number = Column(String, unique=True, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.PUBLIC)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sessions = relationship("UserSession", back_populates="user")

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="sessions")

class NotificationSubscription(Base):
    __tablename__ = "notification_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscriber_type = Column(String, nullable=False)  # service, user, admin
    subscriber_id = Column(String, nullable=False)
    notification_type = Column(String, nullable=False)  # emergency, status_update, service_status
    channel = Column(String, nullable=False)  # websocket, email, sms, push
    created_at = Column(DateTime, default=datetime.utcnow) 