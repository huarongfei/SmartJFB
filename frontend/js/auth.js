// Authentication-specific functionality

// Store authentication state
let authToken = localStorage.getItem('smartjfb_token') || null;
let currentUser = JSON.parse(localStorage.getItem('smartjfb_user')) || null;

document.addEventListener('DOMContentLoaded', function() {
  initAuthPage();
});

function initAuthPage() {
  // Initialize event handlers for auth page
  initAuthEventHandlers();
  
  // Check if user is already logged in
  checkAuthStatus();
  
  // Update connection status
  checkConnectionStatus();
}

function initAuthEventHandlers() {
  // Login form
  document.getElementById('login-btn')?.addEventListener('click', login);
  document.getElementById('show-register')?.addEventListener('click', showRegisterForm);
  document.getElementById('show-forgot-password')?.addEventListener('click', showForgotPasswordForm);
  
  // Register form
  document.getElementById('register-btn')?.addEventListener('click', register);
  document.getElementById('show-login')?.addEventListener('click', showLoginForm);
  
  // Forgot password form
  document.getElementById('forgot-password-btn')?.addEventListener('click', forgotPassword);
  document.getElementById('back-to-login')?.addEventListener('click', showLoginForm);
  
  // Profile management
  document.getElementById('update-profile-btn')?.addEventListener('click', updateProfile);
  document.getElementById('change-password-btn')?.addEventListener('click', changePassword);
  document.getElementById('logout-btn')?.addEventListener('click', logout);
}

// Check if user is already authenticated
function checkAuthStatus() {
  if (authToken && currentUser) {
    // User is logged in, show profile section
    showProfileSection();
    updateSessionInfo();
  } else {
    // User is not logged in, show login section
    showLoginSection();
    updateSessionInfo();
  }
}

// Login function
async function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  
  if (!username || !password) {
    alert('请填写用户名和密码');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Login successful:', result);
      
      // Store token and user info
      authToken = result.token;
      currentUser = result.user;
      
      localStorage.setItem('smartjfb_token', authToken);
      localStorage.setItem('smartjfb_user', JSON.stringify(currentUser));
      
      // Show profile section
      showProfileSection();
      updateSessionInfo();
      
      alert('登录成功');
    } else {
      throw new Error(result.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert(`登录失败: ${error.message}`);
  }
}

// Register function
async function register() {
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  const role = document.getElementById('register-role').value;
  
  if (!username || !email || !password || !confirmPassword) {
    alert('请填写所有必填字段');
    return;
  }
  
  if (password !== confirmPassword) {
    alert('两次输入的密码不一致');
    return;
  }
  
  if (password.length < 6) {
    alert('密码长度至少为6位');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password, role })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Registration successful:', result);
      
      // Auto-login after registration
      authToken = result.token;
      currentUser = result.user;
      
      localStorage.setItem('smartjfb_token', authToken);
      localStorage.setItem('smartjfb_user', JSON.stringify(currentUser));
      
      // Show profile section
      showProfileSection();
      updateSessionInfo();
      
      alert('注册成功，已自动登录');
    } else {
      throw new Error(result.error || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert(`注册失败: ${error.message}`);
  }
}

// Forgot password function
async function forgotPassword() {
  const email = document.getElementById('forgot-email').value;
  
  if (!email) {
    alert('请输入邮箱地址');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Password reset request sent:', result);
      alert('密码重置链接已发送到您的邮箱');
    } else {
      throw new Error(result.error || 'Password reset request failed');
    }
  } catch (error) {
    console.error('Password reset error:', error);
    alert(`发送密码重置邮件失败: ${error.message}`);
  }
}

// Update profile function
async function updateProfile() {
  if (!authToken || !currentUser) {
    alert('请先登录');
    return;
  }
  
  const username = document.getElementById('profile-username').value;
  const email = document.getElementById('profile-email').value;
  
  if (!username || !email) {
    alert('请填写用户名和邮箱');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ username, email })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Profile updated:', result);
      
      // Update current user info
      currentUser = result.user;
      localStorage.setItem('smartjfb_user', JSON.stringify(currentUser));
      
      updateSessionInfo();
      alert('个人资料更新成功');
    } else {
      throw new Error(result.error || 'Profile update failed');
    }
  } catch (error) {
    console.error('Profile update error:', error);
    alert(`更新个人资料失败: ${error.message}`);
  }
}

// Change password function
async function changePassword() {
  if (!authToken || !currentUser) {
    alert('请先登录');
    return;
  }
  
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmNewPassword = document.getElementById('confirm-new-password').value;
  
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    alert('请填写所有密码字段');
    return;
  }
  
  if (newPassword !== confirmNewPassword) {
    alert('两次输入的新密码不一致');
    return;
  }
  
  if (newPassword.length < 6) {
    alert('新密码长度至少为6位');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Password changed:', result);
      alert('密码修改成功');
      
      // Clear form
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-new-password').value = '';
    } else {
      throw new Error(result.error || 'Password change failed');
    }
  } catch (error) {
    console.error('Password change error:', error);
    alert(`修改密码失败: ${error.message}`);
  }
}

// Logout function
function logout() {
  if (!confirm('确定要退出登录吗？')) {
    return;
  }
  
  // Clear stored data
  authToken = null;
  currentUser = null;
  
  localStorage.removeItem('smartjfb_token');
  localStorage.removeItem('smartjfb_user');
  
  // Show login section
  showLoginSection();
  updateSessionInfo();
  
  alert('已退出登录');
}

// Show login section
function showLoginSection() {
  document.getElementById('login-section').classList.remove('hidden');
  document.getElementById('register-section').classList.add('hidden');
  document.getElementById('forgot-password-section').classList.add('hidden');
  document.getElementById('profile-section').classList.add('hidden');
}

// Show register section
function showRegisterForm() {
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('register-section').classList.remove('hidden');
  document.getElementById('forgot-password-section').classList.add('hidden');
  document.getElementById('profile-section').classList.add('hidden');
}

// Show forgot password section
function showForgotPasswordForm() {
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('register-section').classList.add('hidden');
  document.getElementById('forgot-password-section').classList.remove('hidden');
  document.getElementById('profile-section').classList.add('hidden');
}

// Show profile section
function showProfileSection() {
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('register-section').classList.add('hidden');
  document.getElementById('forgot-password-section').classList.add('hidden');
  document.getElementById('profile-section').classList.remove('hidden');
  
  // Populate profile form with current user data
  if (currentUser) {
    document.getElementById('profile-username').value = currentUser.username || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    document.getElementById('profile-role').value = currentUser.role || '';
    document.getElementById('profile-created-at').value = currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleString() : '';
  }
}

// Update session info display
function updateSessionInfo() {
  document.getElementById('login-status').textContent = authToken ? '已登录' : '未登录';
  document.getElementById('current-user').textContent = currentUser ? currentUser.username : '-';
  document.getElementById('user-role').textContent = currentUser ? currentUser.role : '-';
  document.getElementById('login-time').textContent = currentUser ? new Date().toLocaleString() : '-';
}