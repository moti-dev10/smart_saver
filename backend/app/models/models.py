from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    user = "user"
    editor = "editor"
    admin = "admin"


class ReportType(str, enum.Enum):
    deal_wrong = "deal_wrong"       # הטבה לא קיימת / שגויה
    deal_suggest = "deal_suggest"   # הצעת הטבה חדשה


class ReportStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Retailer(Base):
    __tablename__ = "retailers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    logo_url = Column(String)
    affiliate_url = Column(String)

    clubs = relationship("Club", back_populates="retailer")
    deals = relationship("Deal", back_populates="retailer")


class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    retailer_id = Column(Integer, ForeignKey("retailers.id"), nullable=False)
    name = Column(String, nullable=False)

    retailer = relationship("Retailer", back_populates="clubs")
    deals = relationship("Deal", back_populates="club")
    user_clubs = relationship("UserClub", back_populates="club")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    category = Column(String)
    barcode = Column(String)
    image_url = Column(String)

    deals = relationship("Deal", back_populates="product")


class Deal(Base):
    __tablename__ = "deals"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    retailer_id = Column(Integer, ForeignKey("retailers.id"), nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)
    regular_price = Column(Float, nullable=False)
    deal_price = Column(Float, nullable=False)
    valid_from = Column(Date)
    valid_until = Column(Date)

    product = relationship("Product", back_populates="deals")
    retailer = relationship("Retailer", back_populates="deals")
    club = relationship("Club", back_populates="deals")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    avatar_url = Column(String)
    password_hash = Column(String, nullable=True)   # null for Google-only users
    google_id = Column(String, unique=True, nullable=True)
    role = Column(SAEnum(UserRole), default=UserRole.user, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_clubs = relationship("UserClub", back_populates="user")
    reports = relationship("DealReport", back_populates="user", foreign_keys="DealReport.user_id")


class UserClub(Base):
    __tablename__ = "user_clubs"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), primary_key=True)

    user = relationship("User", back_populates="user_clubs")
    club = relationship("Club", back_populates="user_clubs")


class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    target_price = Column(Float, nullable=False)       # מחיר יעד שמתחתיו לשלוח התראה
    is_active = Column(String, default="active")       # active / triggered / cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    triggered_at = Column(DateTime, nullable=True)

    user = relationship("User")
    product = relationship("Product")


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    product = relationship("Product")


class DealClick(Base):
    __tablename__ = "deal_clicks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False)
    clicked_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    deal = relationship("Deal")


class DealReport(Base):
    __tablename__ = "deal_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=True)       # null for new-deal suggestions
    report_type = Column(SAEnum(ReportType), nullable=False)
    status = Column(SAEnum(ReportStatus), default=ReportStatus.pending, nullable=False)
    notes = Column(String)                                                  # תיאור חופשי מהמשתמש
    # שדות להצעת הטבה חדשה
    suggested_retailer = Column(String)
    suggested_price = Column(Float)
    suggested_club = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    user = relationship("User", back_populates="reports", foreign_keys="DealReport.user_id")
    deal = relationship("Deal")
