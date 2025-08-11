import re
import unicodedata
from models import Notification
from app import db

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'svg', 'mp4', 'webm', 'pdf'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_slug(text):
    """Create a URL-friendly slug from text"""
    # Remove accents and special characters
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    # Convert to lowercase and replace spaces with hyphens
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    text = re.sub(r'[-\s]+', '-', text)
    return text

def create_notification(title, message, notification_type='general', related_project_id=None, related_user_id=None):
    """Create a new notification"""
    notification = Notification(
        title=title,
        message=message,
        notification_type=notification_type,
        related_project_id=related_project_id,
        related_user_id=related_user_id
    )
    db.session.add(notification)
    return notification
