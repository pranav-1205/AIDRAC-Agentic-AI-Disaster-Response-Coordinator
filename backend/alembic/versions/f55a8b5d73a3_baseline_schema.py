"""baseline schema

Revision ID: f55a8b5d73a3
Revises:
Create Date: 2026-09-25 20:22:52.531673
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f55a8b5d73a3'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Full baseline: creates every table declared in app.models from scratch.
    op.create_table('disasters',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('type', sa.String(length=100), nullable=False),
    sa.Column('severity', sa.String(length=50), nullable=False),
    sa.Column('latitude', sa.Float(), nullable=False),
    sa.Column('longitude', sa.Float(), nullable=False),
    sa.Column('description', sa.String(length=1000), nullable=True),
    sa.Column('status', sa.String(length=50), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_disasters_id'), 'disasters', ['id'], unique=False)
    op.create_table('hospitals',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('latitude', sa.Float(), nullable=False),
    sa.Column('longitude', sa.Float(), nullable=False),
    sa.Column('emergency_available', sa.Boolean(), nullable=True),
    sa.Column('phone', sa.String(length=20), nullable=True),
    sa.Column('address', sa.String(length=500), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_hospitals_id'), 'hospitals', ['id'], unique=False)
    op.create_table('routes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('source_lat', sa.Float(), nullable=False),
    sa.Column('source_lng', sa.Float(), nullable=False),
    sa.Column('destination_lat', sa.Float(), nullable=False),
    sa.Column('destination_lng', sa.Float(), nullable=False),
    sa.Column('estimated_time', sa.Float(), nullable=True),
    sa.Column('distance_km', sa.Float(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_routes_id'), 'routes', ['id'], unique=False)
    op.create_table('shelters',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('latitude', sa.Float(), nullable=False),
    sa.Column('longitude', sa.Float(), nullable=False),
    sa.Column('capacity', sa.Integer(), nullable=False),
    sa.Column('occupancy', sa.Integer(), nullable=True),
    sa.Column('phone', sa.String(length=20), nullable=True),
    sa.Column('address', sa.String(length=500), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_shelters_id'), 'shelters', ['id'], unique=False)
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('full_name', sa.String(length=255), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('password', sa.String(length=255), nullable=False),
    sa.Column('role', sa.Enum('ADMIN', 'USER', name='userrole'), nullable=False),
    sa.Column('last_latitude', sa.Float(), nullable=True),
    sa.Column('last_longitude', sa.Float(), nullable=True),
    sa.Column('location_accuracy', sa.Float(), nullable=True),
    sa.Column('last_location_update', sa.DateTime(timezone=True), nullable=True),
    sa.Column('location_timestamp', sa.BigInteger(), nullable=True),
    sa.Column('location_visibility', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.Column('is_online', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_table('alerts',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('disaster_id', sa.Integer(), nullable=True),
    sa.Column('severity', sa.String(length=50), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('external_id', sa.String(length=255), nullable=True),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('event', sa.String(length=255), nullable=True),
    sa.Column('urgency', sa.String(length=50), nullable=True),
    sa.Column('certainty', sa.String(length=50), nullable=True),
    sa.Column('area', sa.String(length=500), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('expired_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('polygons', sa.Text(), nullable=True),
    sa.Column('source', sa.String(length=50), nullable=True),
    sa.Column('latitude', sa.Float(), nullable=True),
    sa.Column('longitude', sa.Float(), nullable=True),
    sa.Column('accuracy', sa.Float(), nullable=True),
    sa.Column('timestamp', sa.BigInteger(), nullable=True),
    sa.Column('location_source', sa.String(length=30), nullable=True),
    sa.ForeignKeyConstraint(['disaster_id'], ['disasters.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('external_id')
    )
    op.create_index(op.f('ix_alerts_id'), 'alerts', ['id'], unique=False)
    op.create_table('sos_incidents',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('reporting_user_id', sa.Integer(), nullable=False),
    sa.Column('assigned_responder_id', sa.Integer(), nullable=True),
    sa.Column('latitude', sa.Float(), nullable=False),
    sa.Column('longitude', sa.Float(), nullable=False),
    sa.Column('location_accuracy', sa.Float(), nullable=True),
    sa.Column('location_timestamp', sa.BigInteger(), nullable=True),
    sa.Column('emergency_type', sa.String(length=100), nullable=True),
    sa.Column('emergency_details', sa.Text(), nullable=True),
    sa.Column('status', sa.Enum('ACTIVE', 'CANCELLED', 'RESOLVED', 'RECEIVED', 'ACKNOWLEDGED', 'AWAITING_RESPONDER', 'RESPONDER_ASSIGNED', 'RESPONDER_ACCEPTED', 'ASSISTANCE_IN_PROGRESS', 'ASSISTANCE_PROVIDED', 'USER_CONFIRMED_SAFE', name='sosstatus'), nullable=False),
    sa.Column('responder_type', sa.Enum('COMMUNITY', 'OFFICIAL', name='sosrespondertype'), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['assigned_responder_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['reporting_user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sos_incidents_assigned_responder_id'), 'sos_incidents', ['assigned_responder_id'], unique=False)
    op.create_index(op.f('ix_sos_incidents_id'), 'sos_incidents', ['id'], unique=False)
    op.create_index(op.f('ix_sos_incidents_reporting_user_id'), 'sos_incidents', ['reporting_user_id'], unique=False)
    op.create_index(op.f('ix_sos_incidents_status'), 'sos_incidents', ['status'], unique=False)
    op.create_table('user_settings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('theme', sa.String(length=20), nullable=True),
    sa.Column('accent_color', sa.String(length=20), nullable=True),
    sa.Column('notifications_enabled', sa.Boolean(), nullable=True),
    sa.Column('email_notifications', sa.Boolean(), nullable=True),
    sa.Column('push_notifications', sa.Boolean(), nullable=True),
    sa.Column('sound_alerts', sa.Boolean(), nullable=True),
    sa.Column('emergency_radius', sa.Integer(), nullable=True),
    sa.Column('min_alert_severity', sa.String(length=20), nullable=True),
    sa.Column('default_map_type', sa.String(length=20), nullable=True),
    sa.Column('auto_locate', sa.Boolean(), nullable=True),
    sa.Column('show_gov_alerts', sa.Boolean(), nullable=True),
    sa.Column('show_user_disasters', sa.Boolean(), nullable=True),
    sa.Column('larger_text', sa.Boolean(), nullable=True),
    sa.Column('reduced_motion', sa.Boolean(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', name='uq_user_settings')
    )
    op.create_index(op.f('ix_user_settings_id'), 'user_settings', ['id'], unique=False)
    op.create_table('alert_locations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('alert_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('latitude', sa.Float(), nullable=False),
    sa.Column('longitude', sa.Float(), nullable=False),
    sa.Column('location_source', sa.String(length=30), nullable=False),
    sa.Column('location_type', sa.String(length=50), nullable=True),
    sa.Column('state', sa.String(length=100), nullable=True),
    sa.Column('district', sa.String(length=100), nullable=True),
    sa.Column('resolved_order', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['alert_id'], ['alerts.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_alert_locations_alert_id'), 'alert_locations', ['alert_id'], unique=False)
    op.create_index(op.f('ix_alert_locations_id'), 'alert_locations', ['id'], unique=False)


def downgrade() -> None:
    # Full baseline: creates every table declared in app.models from scratch.
    op.drop_index(op.f('ix_alert_locations_id'), table_name='alert_locations')
    op.drop_index(op.f('ix_alert_locations_alert_id'), table_name='alert_locations')
    op.drop_table('alert_locations')
    op.drop_index(op.f('ix_user_settings_id'), table_name='user_settings')
    op.drop_table('user_settings')
    op.drop_index(op.f('ix_sos_incidents_status'), table_name='sos_incidents')
    op.drop_index(op.f('ix_sos_incidents_reporting_user_id'), table_name='sos_incidents')
    op.drop_index(op.f('ix_sos_incidents_id'), table_name='sos_incidents')
    op.drop_index(op.f('ix_sos_incidents_assigned_responder_id'), table_name='sos_incidents')
    op.drop_table('sos_incidents')
    op.drop_index(op.f('ix_alerts_id'), table_name='alerts')
    op.drop_table('alerts')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_index(op.f('ix_shelters_id'), table_name='shelters')
    op.drop_table('shelters')
    op.drop_index(op.f('ix_routes_id'), table_name='routes')
    op.drop_table('routes')
    op.drop_index(op.f('ix_hospitals_id'), table_name='hospitals')
    op.drop_table('hospitals')
    op.drop_index(op.f('ix_disasters_id'), table_name='disasters')
    op.drop_table('disasters')
    # Dropping a table does not drop the enum types it referenced, so they must
    # be removed explicitly or a later upgrade fails with DuplicateObjectError.
    sa.Enum(name='sosrespondertype').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='sosstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='userrole').drop(op.get_bind(), checkfirst=True)
