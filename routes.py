import os
from flask import session, render_template, request, redirect, url_for, flash, jsonify, current_app
from flask_login import current_user
from werkzeug.utils import secure_filename
from sqlalchemy import desc, func
import uuid
from urllib.parse import quote

from app import app, db
from replit_auth import require_login, make_replit_blueprint, require_admin
from models import User, Project, Category, Like, Comment, AboutPage, Notification, ProjectMedia
from utils import allowed_file, create_slug, create_notification

app.register_blueprint(make_replit_blueprint(), url_prefix="/auth")

# Make session permanent
@app.before_request
def make_session_permanent():
    session.permanent = True

@app.route('/')
def index():
    # Get featured projects and recent projects
    featured_projects = Project.query.filter_by(is_published=True, is_featured=True).limit(3).all()
    recent_projects = Project.query.filter_by(is_published=True).order_by(desc(Project.created_at)).limit(6).all()
    
    # Get about page info
    about = AboutPage.query.first()
    
    return render_template('index.html', 
                         featured_projects=featured_projects, 
                         recent_projects=recent_projects,
                         about=about)

@app.route('/projetos')
def projects():
    page = request.args.get('page', 1, type=int)
    category_id = request.args.get('category', type=int)
    
    query = Project.query.filter_by(is_published=True)
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    projects = query.order_by(desc(Project.created_at)).paginate(
        page=page, per_page=12, error_out=False
    )
    
    categories = Category.query.all()
    
    return render_template('projects.html', projects=projects, categories=categories, selected_category=category_id)

@app.route('/projeto/<slug>')
def project_detail(slug):
    project = Project.query.filter_by(slug=slug, is_published=True).first_or_404()
    
    # Increment view count
    project.view_count += 1
    db.session.commit()
    
    # Get comments
    comments = Comment.query.filter_by(project_id=project.id, is_approved=True).order_by(desc(Comment.created_at)).all()
    
    # Check if current user liked this project
    user_liked = False
    if current_user.is_authenticated:
        user_liked = project.is_liked_by_user(current_user.id)
    
    return render_template('project_detail.html', project=project, comments=comments, user_liked=user_liked)

@app.route('/sobre')
def about():
    about = AboutPage.query.first()
    if not about:
        # Create default about page
        about = AboutPage()
        about.title = "Sobre Mim"
        about.content = "Apaixonada por tecnologia e formada em Análise e Desenvolvimento de Sistemas pelo SENAI 'Morvan Figueiredo'"
        about.contact_email = "rafaelaolbo@gmail.com"
        about.linkedin_url = "https://www.linkedin.com/in/rafaela-botelho-76a4a72b0/"
        about.github_url = "https://github.com/bruxa61"
        about.instagram_url = "https://www.instagram.com/r.afita_/"
        about.whatsapp_url = "https://wa.me/5511986261266"
        db.session.add(about)
        db.session.commit()
    
    return render_template('about.html', about=about)

@app.route('/login')
def login_page():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    return render_template('login.html')

# Like/Unlike project
@app.route('/projeto/<int:project_id>/curtir', methods=['POST'])
@require_login
def toggle_like(project_id):
    project = Project.query.get_or_404(project_id)
    existing_like = project.get_like_by_user(current_user.id)
    
    if existing_like:
        # Unlike
        db.session.delete(existing_like)
        project.likes_count -= 1
        liked = False
    else:
        # Like
        like = Like()
        like.user_id = current_user.id
        like.project_id = project_id
        db.session.add(like)
        project.likes_count += 1
        liked = True
        
        # Create notification for admin
        create_notification(
            title="Novo curtida!",
            message=f"{current_user.first_name or 'Usuário'} curtiu o projeto '{project.title}'",
            notification_type="like",
            related_project_id=project_id,
            related_user_id=current_user.id
        )
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'liked': liked,
        'likes_count': project.likes_count
    })

# Add comment
@app.route('/projeto/<int:project_id>/comentar', methods=['POST'])
@require_login
def add_comment(project_id):
    project = Project.query.get_or_404(project_id)
    content = request.form.get('content', '').strip()
    
    if not content:
        flash('O comentário não pode estar vazio.', 'error')
        return redirect(url_for('project_detail', slug=project.slug))
    
    comment = Comment()
    comment.user_id = current_user.id
    comment.project_id = project_id
    comment.content = content
    
    db.session.add(comment)
    project.comments_count += 1
    db.session.commit()
    
    # Create notification for admin
    create_notification(
        title="Novo comentário!",
        message=f"{current_user.first_name or 'Usuário'} comentou no projeto '{project.title}'",
        notification_type="comment",
        related_project_id=project_id,
        related_user_id=current_user.id
    )
    
    flash('Comentário adicionado com sucesso!', 'success')
    return redirect(url_for('project_detail', slug=project.slug))

# Share on LinkedIn
@app.route('/projeto/<slug>/compartilhar')
def share_linkedin(slug):
    project = Project.query.filter_by(slug=slug, is_published=True).first_or_404()
    
    # Create LinkedIn share URL
    project_url = url_for('project_detail', slug=project.slug, _external=True)
    share_text = f"Confira este projeto incrível: {project.title}"
    
    linkedin_url = f"https://www.linkedin.com/sharing/share-offsite/?url={quote(project_url)}&title={quote(project.title)}&summary={quote(share_text)}"
    
    return redirect(linkedin_url)

# Admin routes
@app.route('/admin')
@require_admin
def admin_dashboard():
    # Get statistics
    total_projects = Project.query.count()
    published_projects = Project.query.filter_by(is_published=True).count()
    draft_projects = Project.query.filter_by(is_published=False).count()
    total_likes = Like.query.count()
    total_comments = Comment.query.count()
    total_users = User.query.count()
    
    # Get recent activity
    recent_comments = Comment.query.order_by(desc(Comment.created_at)).limit(5).all()
    recent_projects = Project.query.order_by(desc(Project.created_at)).limit(5).all()
    
    # Get unread notifications
    unread_notifications = Notification.query.filter_by(is_read=False).order_by(desc(Notification.created_at)).limit(10).all()
    
    return render_template('admin/dashboard.html',
                         total_projects=total_projects,
                         published_projects=published_projects,
                         draft_projects=draft_projects,
                         total_likes=total_likes,
                         total_comments=total_comments,
                         total_users=total_users,
                         recent_comments=recent_comments,
                         recent_projects=recent_projects,
                         unread_notifications=unread_notifications)

@app.route('/admin/projetos')
@require_admin
def admin_projects():
    page = request.args.get('page', 1, type=int)
    projects = Project.query.order_by(desc(Project.created_at)).paginate(
        page=page, per_page=20, error_out=False
    )
    return render_template('admin/projects.html', projects=projects)

@app.route('/admin/projeto/novo')
@require_admin
def admin_new_project():
    categories = Category.query.all()
    return render_template('admin/project_form.html', categories=categories)

@app.route('/admin/projeto/<int:project_id>/editar')
@require_admin
def admin_edit_project(project_id):
    project = Project.query.get_or_404(project_id)
    categories = Category.query.all()
    return render_template('admin/project_form.html', project=project, categories=categories)

@app.route('/admin/projeto/salvar', methods=['POST'])
@require_admin
def admin_save_project():
    project_id = request.form.get('project_id')
    
    if project_id:
        project = Project.query.get_or_404(project_id)
    else:
        project = Project()
        db.session.add(project)
    
    project.title = request.form.get('title', '').strip()
    project.description = request.form.get('description', '').strip()
    project.content = request.form.get('content', '').strip()
    project.demo_url = request.form.get('demo_url', '').strip()
    project.github_url = request.form.get('github_url', '').strip()
    project.technologies = request.form.get('technologies', '').strip()
    project.category_id = request.form.get('category_id', type=int)
    project.is_featured = 'is_featured' in request.form
    project.is_published = 'is_published' in request.form
    
    # Generate slug if new project
    if not project_id:
        project.slug = create_slug(project.title)
    
    # Handle file upload
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add UUID to prevent conflicts
            filename = f"{uuid.uuid4().hex}_{filename}"
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            
            # Create upload directory if it doesn't exist
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            file.save(file_path)
            
            project.image_url = f"/static/uploads/{filename}"
    
    try:
        db.session.commit()
        flash('Projeto salvo com sucesso!', 'success')
        return redirect(url_for('admin_projects'))
    except Exception as e:
        db.session.rollback()
        flash('Erro ao salvar projeto. Tente novamente.', 'error')
        return redirect(request.referrer)

@app.route('/admin/projeto/<int:project_id>/excluir', methods=['POST'])
@require_admin
def admin_delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    
    try:
        db.session.delete(project)
        db.session.commit()
        flash('Projeto excluído com sucesso!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Erro ao excluir projeto.', 'error')
    
    return redirect(url_for('admin_projects'))

@app.route('/admin/sobre')
@require_admin
def admin_about():
    about = AboutPage.query.first()
    if not about:
        about = AboutPage()
        db.session.add(about)
        db.session.commit()
    
    return render_template('admin/about.html', about=about)

@app.route('/admin/sobre/salvar', methods=['POST'])
@require_admin
def admin_save_about():
    about = AboutPage.query.first()
    if not about:
        about = AboutPage()
        db.session.add(about)
    
    about.title = request.form.get('title', '').strip()
    about.content = request.form.get('content', '').strip()
    about.skills = request.form.get('skills', '').strip()
    about.contact_email = request.form.get('contact_email', '').strip()
    about.contact_phone = request.form.get('contact_phone', '').strip()
    about.linkedin_url = request.form.get('linkedin_url', '').strip()
    about.github_url = request.form.get('github_url', '').strip()
    about.instagram_url = request.form.get('instagram_url', '').strip()
    about.whatsapp_url = request.form.get('whatsapp_url', '').strip()
    about.resume_url = request.form.get('resume_url', '').strip()
    
    # Handle profile image upload
    if 'profile_image' in request.files:
        file = request.files['profile_image']
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filename = f"profile_{uuid.uuid4().hex}_{filename}"
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            file.save(file_path)
            
            about.profile_image = f"/static/uploads/{filename}"
    
    try:
        db.session.commit()
        flash('Informações salvas com sucesso!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Erro ao salvar informações.', 'error')
    
    return redirect(url_for('admin_about'))

# Mark notification as read
@app.route('/admin/notificacao/<int:notification_id>/ler', methods=['POST'])
@require_admin
def mark_notification_read(notification_id):
    notification = Notification.query.get_or_404(notification_id)
    notification.is_read = True
    db.session.commit()
    
    return jsonify({'success': True})

# ==========================================
# SIMPLE PROJECT MANAGEMENT ROUTES
# ==========================================

@app.route('/admin/projetos/simples')
@require_admin
def admin_simple_projects():
    page = request.args.get('page', 1, type=int)
    projects = Project.query.order_by(desc(Project.created_at)).paginate(
        page=page, per_page=12, error_out=False
    )
    return render_template('admin/simple_projects.html', projects=projects)

@app.route('/admin/projetos/simples/criar', methods=['POST'])
@require_admin
def admin_simple_project_create():
    title = request.form.get('title', '').strip()
    description = request.form.get('description', '').strip()
    github_url = request.form.get('github_url', '').strip()
    is_published = 'is_published' in request.form
    
    if not title or not description:
        flash('Título e descrição são obrigatórios.', 'error')
        return redirect(url_for('admin_simple_projects'))
    
    # Create new project
    project = Project()
    project.title = title
    project.description = description
    project.github_url = github_url if github_url else None
    project.is_published = is_published
    project.slug = create_slug(title)
    
    # Handle image upload
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filename = f"project_{uuid.uuid4().hex}_{filename}"
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            file.save(file_path)
            
            project.image_url = f"/static/uploads/{filename}"
    
    try:
        db.session.add(project)
        db.session.commit()
        flash(f'Projeto "{title}" criado com sucesso!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Erro ao criar projeto. Tente novamente.', 'error')
    
    return redirect(url_for('admin_simple_projects'))

@app.route('/admin/projetos/simples/<int:project_id>/editar', methods=['POST'])
@require_admin
def admin_simple_project_edit(project_id):
    project = Project.query.get_or_404(project_id)
    
    title = request.form.get('title', '').strip()
    description = request.form.get('description', '').strip()
    github_url = request.form.get('github_url', '').strip()
    is_published = 'is_published' in request.form
    
    if not title or not description:
        flash('Título e descrição são obrigatórios.', 'error')
        return redirect(url_for('admin_simple_projects'))
    
    # Update project
    project.title = title
    project.description = description
    project.github_url = github_url if github_url else None
    project.is_published = is_published
    
    # Update slug if title changed
    if title != project.title:
        project.slug = create_slug(title)
    
    # Handle new image upload
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filename = f"project_{uuid.uuid4().hex}_{filename}"
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            file.save(file_path)
            
            project.image_url = f"/static/uploads/{filename}"
    
    try:
        db.session.commit()
        flash(f'Projeto "{title}" atualizado com sucesso!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Erro ao atualizar projeto. Tente novamente.', 'error')
    
    return redirect(url_for('admin_simple_projects'))

@app.route('/admin/projetos/simples/<int:project_id>/excluir', methods=['POST'])
@require_admin
def admin_simple_project_delete(project_id):
    project = Project.query.get_or_404(project_id)
    project_title = project.title
    
    try:
        db.session.delete(project)
        db.session.commit()
        flash(f'Projeto "{project_title}" excluído com sucesso!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Erro ao excluir projeto. Tente novamente.', 'error')
    
    return redirect(url_for('admin_simple_projects'))

# Health check for Railway deployment
@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Portfolio application is running',
        'database': 'connected' if db.engine else 'disconnected'
    })

# Debug route to check admin status
@app.route('/debug/user')
def debug_user():
    if not current_user.is_authenticated:
        return jsonify({
            'authenticated': False,
            'message': 'User not logged in'
        })
    
    return jsonify({
        'authenticated': True,
        'user_id': current_user.id,
        'email': current_user.email,
        'first_name': current_user.first_name,
        'last_name': current_user.last_name,
        'is_admin': current_user.is_admin,
        'profile_image_url': current_user.profile_image_url
    })

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('500.html'), 500
