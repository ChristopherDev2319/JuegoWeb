// ============================================
// ADMIN PANEL - Main Module
// ============================================

/**
 * Panel de administración para BearStrike
 * Gestión de usuarios y baneos
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api'
    : '/api';

// State
let state = {
    user: null,
    token: null,
    currentView: 'users',
    users: {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
        search: ''
    },
    bans: {
        data: [],
        includeExpired: false
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await initializeAdmin();
});

async function initializeAdmin() {
    // Check authentication
    const token = localStorage.getItem('fps_game_token');
    const userStr = localStorage.getItem('fps_game_user');

    if (!token || !userStr) {
        showAccessDenied('Debes iniciar sesión para acceder al panel de administración.');
        return;
    }

    try {
        state.user = JSON.parse(userStr);
        state.token = token;
    } catch (e) {
        showAccessDenied('Error al cargar datos de usuario.');
        return;
    }

    // Check admin role - Requirement 4.1
    if (state.user.role !== 'admin') {
        showAccessDenied('No tienes permisos de administrador.');
        return;
    }

    // Verify token is still valid by making a test request
    try {
        const response = await fetchAPI('/admin/users?limit=1');
        if (!response.success) {
            showAccessDenied('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            return;
        }
    } catch (error) {
        showAccessDenied('Error de conexión con el servidor.');
        return;
    }

    // Show admin panel
    showAdminPanel();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    await loadUsers();
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function showAccessDenied(message) {
    document.getElementById('admin-loading').classList.add('hidden');
    document.getElementById('denied-message').textContent = message;
    document.getElementById('access-denied').classList.remove('hidden');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function showAdminPanel() {
    document.getElementById('admin-loading').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    document.getElementById('admin-username').textContent = state.user.username;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // Modal overlays
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', closeAllModals);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });
}

// ============================================
// VIEW MANAGEMENT
// ============================================

function switchView(view) {
    state.currentView = view;
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Update views
    document.querySelectorAll('.admin-view').forEach(v => {
        v.classList.toggle('active', v.id === `view-${view}`);
    });

    // Load data for view
    if (view === 'users') {
        loadUsers();
    } else if (view === 'bans') {
        loadBans();
    }
}

// ============================================
// API HELPERS
// ============================================

async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.token}`,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (response.status === 401) {
            // Token expired
            handleLogout();
            return { success: false, message: 'Sesión expirada' };
        }
        
        if (response.status === 403) {
            showToast('No tienes permisos para esta acción', 'error');
            return { success: false, message: 'Acceso denegado' };
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        showToast('Error de conexión', 'error');
        return { success: false, message: 'Error de conexión' };
    }
}

// ============================================
// USERS MANAGEMENT - Requirements 4.2, 4.4
// ============================================

async function loadUsers() {
    const { page, limit, search } = state.users.pagination;
    let endpoint = `/admin/users?page=${page}&limit=${limit}`;
    if (state.users.search) {
        endpoint += `&search=${encodeURIComponent(state.users.search)}`;
    }

    const response = await fetchAPI(endpoint);
    
    if (response.success) {
        state.users.data = response.data.users;
        state.users.pagination = { ...state.users.pagination, ...response.data.pagination };
        renderUsersView();
    }
}

function renderUsersView() {
    const container = document.getElementById('view-users');
    const { data, pagination, search } = state.users;

    container.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">Gestión de Usuarios</h2>
            <div class="search-box">
                <i data-lucide="search"></i>
                <input type="text" 
                       id="user-search" 
                       placeholder="Buscar por usuario o email..." 
                       value="${search}">
            </div>
        </div>

        <div class="data-table">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Usuario</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Registro</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.length === 0 ? `
                        <tr>
                            <td colspan="6">
                                <div class="empty-state">
                                    <i data-lucide="users"></i>
                                    <p>No se encontraron usuarios</p>
                                </div>
                            </td>
                        </tr>
                    ` : data.map(user => `
                        <tr>
                            <td>${user.id}</td>
                            <td><strong>${escapeHtml(user.username)}</strong></td>
                            <td>${escapeHtml(user.email)}</td>
                            <td>
                                <span class="role-badge ${user.role}">
                                    ${user.role === 'admin' ? 'Admin' : 'Jugador'}
                                </span>
                            </td>
                            <td>${formatDate(user.created_at)}</td>
                            <td>
                                <button class="btn-action" onclick="viewUserDetail(${user.id})">
                                    <i data-lucide="eye"></i>
                                    Ver
                                </button>
                                ${user.role !== 'admin' ? `
                                    <button class="btn-action danger" onclick="openBanModal(${user.id}, '${escapeHtml(user.username)}')">
                                        <i data-lucide="ban"></i>
                                        Banear
                                    </button>
                                ` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${pagination.total_pages > 1 ? `
            <div class="pagination">
                <button class="pagination-btn" 
                        onclick="changePage(${pagination.page - 1})"
                        ${pagination.page <= 1 ? 'disabled' : ''}>
                    Anterior
                </button>
                <span class="pagination-info">
                    Página ${pagination.page} de ${pagination.total_pages}
                </span>
                <button class="pagination-btn" 
                        onclick="changePage(${pagination.page + 1})"
                        ${pagination.page >= pagination.total_pages ? 'disabled' : ''}>
                    Siguiente
                </button>
            </div>
        ` : ''}
    `;

    // Setup search
    const searchInput = document.getElementById('user-search');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.users.search = e.target.value;
            state.users.pagination.page = 1;
            loadUsers();
        }, 300);
    });

    refreshIcons();
}

// ============================================
// USER DETAIL - Requirement 4.3
// ============================================

async function viewUserDetail(userId) {
    const response = await fetchAPI(`/admin/users/${userId}`);
    
    if (!response.success) {
        showToast('Error al cargar usuario', 'error');
        return;
    }

    const { user, stats, ban_history } = response.data;
    
    const content = document.getElementById('user-detail-content');
    content.innerHTML = `
        <div class="modal-header">
            <h3 class="modal-title">Detalle de Usuario</h3>
            <button class="modal-close" onclick="closeAllModals()">
                <i data-lucide="x"></i>
            </button>
        </div>

        <div class="user-detail-grid">
            <div class="detail-item">
                <div class="detail-label">ID</div>
                <div class="detail-value">${user.id}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Usuario</div>
                <div class="detail-value">${escapeHtml(user.username)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Email</div>
                <div class="detail-value">${escapeHtml(user.email)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Rol</div>
                <div class="detail-value">
                    <span class="role-badge ${user.role}">
                        ${user.role === 'admin' ? 'Administrador' : 'Jugador'}
                    </span>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Fecha de Registro</div>
                <div class="detail-value">${formatDate(user.created_at)}</div>
            </div>
        </div>

        <h4 style="color: #7EC8E3; margin-bottom: 15px;">Estadísticas</h4>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${stats.kills || 0}</div>
                <div class="stat-label">Kills</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.deaths || 0}</div>
                <div class="stat-label">Muertes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.matches || 0}</div>
                <div class="stat-label">Partidas</div>
            </div>
        </div>

        ${ban_history && ban_history.length > 0 ? `
            <div class="ban-history">
                <h4 class="ban-history-title">
                    <i data-lucide="ban"></i>
                    Historial de Baneos (${ban_history.length})
                </h4>
                ${ban_history.map(ban => {
                    const isExpired = ban.expires_at && new Date(ban.expires_at) < new Date();
                    const isPermanent = !ban.expires_at;
                    return `
                        <div class="ban-item ${isExpired ? 'expired' : ''}">
                            <div class="ban-reason">${escapeHtml(ban.reason)}</div>
                            <div class="ban-meta">
                                <span>
                                    <span class="ban-status ${isPermanent ? 'permanent' : (isExpired ? 'expired' : 'active')}">
                                        ${isPermanent ? 'Permanente' : (isExpired ? 'Expirado' : 'Activo')}
                                    </span>
                                </span>
                                ${ban.expires_at ? `<span>Expira: ${formatDate(ban.expires_at)}</span>` : ''}
                                <span>Creado: ${formatDate(ban.created_at)}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        ` : `
            <div class="ban-history">
                <h4 class="ban-history-title">
                    <i data-lucide="ban"></i>
                    Historial de Baneos
                </h4>
                <p style="color: rgba(255,255,255,0.5); font-size: 14px;">
                    Este usuario no tiene historial de baneos.
                </p>
            </div>
        `}

        ${user.role !== 'admin' ? `
            <div class="form-actions">
                <button class="btn-primary danger" onclick="closeAllModals(); openBanModal(${user.id}, '${escapeHtml(user.username)}')">
                    <i data-lucide="ban"></i>
                    Banear Usuario
                </button>
            </div>
        ` : ''}
    `;

    document.getElementById('user-detail-modal').classList.remove('hidden');
    refreshIcons();
}

// Make function globally accessible
window.viewUserDetail = viewUserDetail;

// ============================================
// BANS MANAGEMENT - Requirements 3.1, 3.2, 3.5
// ============================================

async function loadBans() {
    const endpoint = `/admin/bans${state.bans.includeExpired ? '?include_expired=true' : ''}`;
    const response = await fetchAPI(endpoint);
    
    if (response.success) {
        state.bans.data = response.data.bans;
        renderBansView();
    }
}

function renderBansView() {
    const container = document.getElementById('view-bans');
    const { data, includeExpired } = state.bans;

    container.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">Gestión de Baneos</h2>
            <div style="display: flex; gap: 15px; align-items: center;">
                <label style="display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.6); font-size: 14px; cursor: pointer;">
                    <input type="checkbox" 
                           id="include-expired" 
                           ${includeExpired ? 'checked' : ''}
                           style="cursor: pointer;">
                    Mostrar expirados
                </label>
            </div>
        </div>

        <div class="data-table">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Usuario</th>
                        <th>Razón</th>
                        <th>Estado</th>
                        <th>Expira</th>
                        <th>Creado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.length === 0 ? `
                        <tr>
                            <td colspan="7">
                                <div class="empty-state">
                                    <i data-lucide="check-circle"></i>
                                    <p>No hay baneos ${includeExpired ? '' : 'activos'}</p>
                                </div>
                            </td>
                        </tr>
                    ` : data.map(ban => {
                        const isExpired = ban.expires_at && new Date(ban.expires_at) < new Date();
                        const isPermanent = !ban.expires_at;
                        return `
                            <tr class="${isExpired ? 'expired' : ''}">
                                <td>${ban.id}</td>
                                <td><strong>${escapeHtml(ban.username)}</strong></td>
                                <td>${escapeHtml(ban.reason)}</td>
                                <td>
                                    <span class="ban-status ${isPermanent ? 'permanent' : (isExpired ? 'expired' : 'active')}">
                                        ${isPermanent ? 'Permanente' : (isExpired ? 'Expirado' : 'Activo')}
                                    </span>
                                </td>
                                <td>${ban.expires_at ? formatDate(ban.expires_at) : '-'}</td>
                                <td>${formatDate(ban.created_at)}</td>
                                <td>
                                    ${!isExpired ? `
                                        <button class="btn-action success" onclick="removeBan(${ban.id})">
                                            <i data-lucide="user-check"></i>
                                            Desbanear
                                        </button>
                                    ` : ''}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Setup include expired checkbox
    document.getElementById('include-expired').addEventListener('change', (e) => {
        state.bans.includeExpired = e.target.checked;
        loadBans();
    });

    refreshIcons();
}

function openBanModal(userId, username) {
    const content = document.getElementById('create-ban-content');
    content.innerHTML = `
        <div class="modal-header">
            <h3 class="modal-title">Banear Usuario</h3>
            <button class="modal-close" onclick="closeAllModals()">
                <i data-lucide="x"></i>
            </button>
        </div>

        <p style="color: rgba(255,255,255,0.7); margin-bottom: 20px;">
            Estás a punto de banear a <strong style="color: #e74c3c;">${escapeHtml(username)}</strong>
        </p>

        <form id="ban-form" onsubmit="submitBan(event, ${userId})">
            <div class="form-group">
                <label class="form-label">Razón del ban *</label>
                <textarea class="form-textarea" 
                          id="ban-reason" 
                          placeholder="Describe la razón del ban..."
                          required
                          minlength="5"
                          maxlength="500"></textarea>
                <div class="form-hint">Mínimo 5 caracteres</div>
            </div>

            <div class="form-group">
                <label class="form-label">Tipo de ban</label>
                <select class="form-select" id="ban-type" onchange="toggleExpirationField()">
                    <option value="temporary">Temporal</option>
                    <option value="permanent">Permanente</option>
                </select>
            </div>

            <div class="form-group" id="expiration-group">
                <label class="form-label">Fecha de expiración *</label>
                <input type="datetime-local" 
                       class="form-input" 
                       id="ban-expiration"
                       min="${getMinDateTime()}">
                <div class="form-hint">El ban expirará automáticamente en esta fecha</div>
            </div>

            <div class="form-actions">
                <button type="button" class="btn-cancel" onclick="closeAllModals()">
                    Cancelar
                </button>
                <button type="submit" class="btn-primary" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                    <i data-lucide="ban"></i>
                    Confirmar Ban
                </button>
            </div>
        </form>
    `;

    document.getElementById('create-ban-modal').classList.remove('hidden');
    refreshIcons();
}

// Make function globally accessible
window.openBanModal = openBanModal;

function toggleExpirationField() {
    const banType = document.getElementById('ban-type').value;
    const expirationGroup = document.getElementById('expiration-group');
    const expirationInput = document.getElementById('ban-expiration');
    
    if (banType === 'permanent') {
        expirationGroup.style.display = 'none';
        expirationInput.removeAttribute('required');
    } else {
        expirationGroup.style.display = 'block';
        expirationInput.setAttribute('required', 'required');
    }
}

// Make function globally accessible
window.toggleExpirationField = toggleExpirationField;

async function submitBan(event, userId) {
    event.preventDefault();
    
    const reason = document.getElementById('ban-reason').value.trim();
    const banType = document.getElementById('ban-type').value;
    const expiration = document.getElementById('ban-expiration').value;

    if (reason.length < 5) {
        showToast('La razón debe tener al menos 5 caracteres', 'error');
        return;
    }

    const body = {
        user_id: userId,
        reason: reason
    };

    if (banType === 'temporary') {
        if (!expiration) {
            showToast('Debes seleccionar una fecha de expiración', 'error');
            return;
        }
        body.expires_at = new Date(expiration).toISOString();
    }

    const response = await fetchAPI('/admin/bans', {
        method: 'POST',
        body: JSON.stringify(body)
    });

    if (response.success) {
        showToast('Usuario baneado exitosamente', 'success');
        closeAllModals();
        loadUsers();
        loadBans();
    } else {
        showToast(response.message || 'Error al crear ban', 'error');
    }
}

// Make function globally accessible
window.submitBan = submitBan;

async function removeBan(banId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este ban?')) {
        return;
    }

    const response = await fetchAPI(`/admin/bans/${banId}`, {
        method: 'DELETE'
    });

    if (response.success) {
        showToast('Ban eliminado exitosamente', 'success');
        loadBans();
    } else {
        showToast(response.message || 'Error al eliminar ban', 'error');
    }
}

// Make function globally accessible
window.removeBan = removeBan;

// ============================================
// PAGINATION
// ============================================

function changePage(page) {
    if (page < 1 || page > state.users.pagination.total_pages) return;
    state.users.pagination.page = page;
    loadUsers();
}

// Make function globally accessible
window.changePage = changePage;

// ============================================
// UTILITIES
// ============================================

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

// Make function globally accessible
window.closeAllModals = closeAllModals;

function handleLogout() {
    localStorage.removeItem('fps_game_token');
    localStorage.removeItem('fps_game_user');
    window.location.href = 'index.html';
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    
    container.appendChild(toast);
    refreshIcons();
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function refreshIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getMinDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
}
