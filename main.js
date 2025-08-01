// ============== 1. 初始化部分 ==============
// Supabase客户端初始化
const SUPABASE_URL = 'https://iglmqwpagzjadwauvchh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbG1xd3BhZ3pqYWR3YXV2Y2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODk4NDAsImV4cCI6MjA2NjQ2NTg0MH0.Mtiwp31mJvbLRTotbrb4_DobjjpM4kg9f4-G8oWz85E';

let supabaseClient;
  console.time('start');
try {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  if(supabaseClient) console.log('Supabase客户端初始化成功');
} catch (error) {
  console.error('Supabase初始化失败:', error);
  showRoundedAlert('系统初始化失败，请刷新页面或联系管理员', 'error'); // 替换alert
}

// ============== 2. DOM元素引用 ==============
const startDateEl = document.getElementById('startDate');
const endDateEl = document.getElementById('endDate');
const queryBtn = document.getElementById('queryBtn');
const clearBtn = document.getElementById('clearBtn');
const summaryTable = document.getElementById('summaryTable').querySelector('tbody');
const detailTable = document.getElementById('detailTable').querySelector('tbody');
const loadingEl = document.getElementById('loading');
const totalQuantityEl = document.getElementById('totalQuantity');
const totalAmountEl = document.getElementById('totalAmount');
const totalProductsEl = document.getElementById('totalProducts');
const totalBrandsEl = document.getElementById('totalBrands');
const toggleDetails = document.getElementById('toggleDetails');
const detailSection = document.getElementById('detailSection');
const totalProfitEl = document.getElementById('totalProfit'); //毛利
const switchWarehouseBtn = document.getElementById('switchWarehouseBtn'); // 切换仓库按钮

// 多选下拉框元素
const warehouseSelector = document.getElementById('warehouseSelector');
const warehouseOptions = document.getElementById('warehouseOptions');
const brandSelector = document.getElementById('brandSelector');
const brandOptions = document.getElementById('brandOptions');
const productSelector = document.getElementById('productSelector');
const productOptions = document.getElementById('productOptions');
const customerSelector = document.getElementById('customerSelector');
const customerOptions = document.getElementById('customerOptions');

// 添加认证相关的DOM引用
const authContainer = document.getElementById('authContainer');
const appContainer = document.getElementById('appContainer');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const registerEmail = document.getElementById('registerEmail');
const registerPassword = document.getElementById('registerPassword');
const registerPhone = document.getElementById('registerPhone');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const authTabs = document.querySelectorAll('.auth-tab');

// 添加用户状态相关的DOM引用
const userStatus = document.getElementById('userStatus');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const userMenu = document.getElementById('userMenu');
const logoutBtn = document.getElementById('logoutBtn');

// ============== 3. 全局状态 ==============
let allWarehouses = [];
let allBrands = [];
let allProductsData = [];
let brandMap = {};
let currentOpenDropdown = null;
let selectedProducts = []; 
let user = null; // 全局用户状态
let currentWarehouse = 'default'; // 'default' 或 'longqiao'
let allSalesPersons = []; // 销售人员列表
let allCustomers = []; // 新增：客户列表
let salesRecords = []; // 存储销售记录

// ============== 4. 工具函数 ==============
// 数字格式化
function formatNumber(num) {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString('zh-CN', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

// 设置默认日期范围
function setDefaultDates() {
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const endDate = new Date();
  const startDate = new Date();
  
  // 检查今天是否是每月1号
  if (endDate.getDate() === 1) {
    // 设置为上个月的1号到上个月最后一天
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(1);
    
    endDate.setMonth(endDate.getMonth() - 1);
    endDate.setDate(new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate());
  } else {
    // 默认设置为当月1号到昨天
    startDate.setDate(1);
    endDate.setDate(endDate.getDate() - 1);
  }
  
  endDateEl.value = formatDate(endDate);
  startDateEl.value = formatDate(startDate);
}

// **** 认证函数，用户状态显示****
async function initAuth() {
  if (!supabaseClient) {
    return false;
  }

  try {
    const { data: { user: currentUser }, error } = await supabaseClient.auth.getUser();

    if (currentUser) {
      user = currentUser;
      // 显示用户状态 - 根据邮箱前缀映射到用户名
      const emailPrefix = currentUser.email.split('@')[0]; // 获取邮箱前缀
      const usernameMap = {
        '162004332': '系统管理员',
        'rickyone': '数据管理员',
        '13762405681': '王英',
        'ksf2025': '康师傅',
        'pepsi_cola': '百事可乐',
        'coca_cola': '可口可乐',
        '15096086678': '娟子'
      };
      // 如果邮箱前缀在映射表中，则使用映射的用户名，否则使用邮箱前缀
      const displayName = usernameMap[emailPrefix] || emailPrefix;
      userName.textContent = displayName;

      userStatus.style.display = 'block';
      authContainer.style.display = 'none';
      appContainer.style.display = 'block';
      return true;
    } else {
      userStatus.style.display = 'none';
      authContainer.style.display = 'block';
      return false;
    }
  } catch (error) {
    console.error('用户认证发生错误:', error);
    return false;
  }
}

// **** 弹窗提示函数 ****
function showRoundedAlert(message, type = 'error') {
  // 移除已有的提示容器
  const existingAlert = document.getElementById('custom-alert');
  if (existingAlert) existingAlert.remove();
  
  // 创建提示容器
  const alertContainer = document.createElement('div');
  alertContainer.id = 'custom-alert';
  alertContainer.className = `rounded-alert ${type}`;
  
  // 创建内容
  alertContainer.innerHTML = `
    <div class="alert-content">
      <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  // 添加到DOM
  document.body.appendChild(alertContainer);
  
  // 计算水平居中位置
  const containerWidth = alertContainer.offsetWidth;
  const leftPosition = (window.innerWidth - containerWidth) / 2;
  
  // 设置位置
  alertContainer.style.top = '20px';
  alertContainer.style.left = `${leftPosition}px`;
  
  // 自动消失
  setTimeout(() => {
    alertContainer.classList.add('fade-out');
    setTimeout(() => alertContainer.remove(), 300);
  }, 2000);
}

// **** 仓库切换功能 ****
function switchWarehouse() {
  // +++ 新增：收起详细记录区域 +++
  if (detailSection.classList.contains('visible')) {
    detailSection.classList.remove('visible');
    // 更新图标方向
    const icon = document.querySelector('#toggleDetails i');
    icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
  }
  
  // 切换仓库状态
  currentWarehouse = currentWarehouse === 'default' ? 'longqiao' : 'default';
  
  // 获取筛选行元素
  const filtersRow = document.querySelector('.filters-row');
  
  // 根据仓库类型添加/移除样式
  if (currentWarehouse === 'longqiao') {
    filtersRow.classList.add('longqiao');
  } else {
    filtersRow.classList.remove('longqiao');
  }
  
  // 立即更新UI布局
  updateUIForWarehouse();  // 位置调整到这里
  
  clearPieChart(); // 清除饼图数据  
  setDefaultDates() // 设置默认日期

  // 重新加载筛选选项
  loadFilterOptions().then(() => {
    // 重置下拉框选择
    warehouseMultiSelect.reset();
    brandMultiSelect.reset();
    productMultiSelect.reset();
    if (customerMultiSelect) { // 重置客户选择
      customerMultiSelect.reset();
    }    
    updateDetailTableHeader(); // 更新表头
    loadData();// 重新加载数据
  });
}

// ****更新UI****
function updateUIForWarehouse() {
  const header = document.querySelector('header h1');
  const profitCard = document.getElementById('profitCard');
  
  if (currentWarehouse === 'longqiao') {
    header.innerHTML = `<img src="icon64.png" alt="应用图标" style="border-radius: 8px; filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5));"> 隆桥仓库销售数据查询系统`;
    document.querySelector('.filter-group label:has(i.fas.fa-warehouse)').innerHTML = `<i class="fas fa-user"></i> 销售人员`;
    profitCard.style.display = 'block';
  } else {
    header.innerHTML = `<img src="icon64.png" alt="应用图标" style="border-radius: 8px; filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5));"> 多多买菜销售数据查询系统`;
    document.querySelector('.filter-group label:has(i.fas.fa-user)').innerHTML = `<i class="fas fa-warehouse"></i> 仓库`;
    profitCard.style.display = 'none';
  }
  // 客户筛选框显示控制
  const customerFilterGroup = document.getElementById('customerFilterGroup');
  if (customerFilterGroup) {
    customerFilterGroup.style.display = currentWarehouse === 'longqiao' ? 'block' : 'none';
  }  
}

// ***更新详细记录表头****
function updateDetailTableHeader() {
  const thead = document.querySelector('#detailTable thead');
  let headerHTML = `
    <tr>
      <th>日期</th>
      <th>${currentWarehouse === 'longqiao' ? '客户名称' : '商品ID'}</th> 
      <th>商品名称</th>
      <th>品牌</th>
      <th>${currentWarehouse === 'longqiao' ? '销售人员' : '仓库'}</th>
      <th>销量</th>
      <th>${currentWarehouse === 'longqiao' ? '成本' : '单价'}</th>
      <th>金额</th>
  `;
  
  if (currentWarehouse === 'longqiao') {
    headerHTML += `<th>毛利</th>`;
  }
  
  headerHTML += `</tr>`;
  
  thead.innerHTML = headerHTML;
}

// ============== 5. 下拉框管理 （类+全局事件） ==============
class MultiSelect {
  constructor(selector, optionsContainer, placeholder) {
    this.selector = selector;
    this.optionsContainer = optionsContainer;
    this.placeholder = placeholder;
    this.selectedValues = [];
    this.allOptions = [];
    this.clearBtn = selector.querySelector('.clear-btn');
    
    // 初始化事件
    this.initEvents();
  }

  initEvents() {
    // 点击选择框显示/隐藏选项
    this.selector.addEventListener('click', (e) => this.toggleDropdown(e));
    
    // 清除按钮事件
    this.clearBtn.addEventListener('click', (e) => this.clearSelection(e));
    
    // 选项容器事件委托
    this.optionsContainer.addEventListener('change', (e) => this.handleOptionChange(e));
    
    // 鼠标事件保持下拉框状态
    this.optionsContainer.addEventListener('mouseenter', () => // 鼠标移入时保持下拉框状态
      this.optionsContainer.classList.add('active'));
    this.optionsContainer.addEventListener('mouseleave', () =>  // 鼠标移出时取消下拉框状态
      this.optionsContainer.classList.remove('active'));
  }

  toggleDropdown(e) { // 切换下拉框状态
    // 新增：检查是否点击了标签移除按钮或标签本身
    if (
      e.target.classList.contains('tag-remove') || 
      e.target.classList.contains('tag') ||
      e.target.closest('.tag-remove') ||
      e.target.closest('.tag')
    ) {
      return; // 如果是标签相关元素，直接返回不处理
    }   

    e.stopPropagation();
    
    // 先关闭所有下拉框（包括当前打开的）
    closeAllDropdowns();
    
    // 然后判断是否需要打开当前下拉框
    const isOpening = !this.optionsContainer.classList.contains('visible');
    
    if (isOpening) {
      this.optionsContainer.classList.add('visible');
      currentOpenDropdown = this.optionsContainer;
      const arrow = this.selector.querySelector('.arrow');
      arrow.classList.replace('fa-chevron-down', 'fa-chevron-up');
      this.positionDropdown();
    }
  }

  positionDropdown() { // 定位下拉框
    const rect = this.selector.getBoundingClientRect();
    const parentRect = this.selector.parentElement.getBoundingClientRect();
    
    this.optionsContainer.style.width = `${rect.width}px`;
    this.optionsContainer.style.left = `${rect.left - parentRect.left}px`;
    this.optionsContainer.style.top = `${rect.bottom - parentRect.top}px`;
  }

  clearSelection(e) { // 清空选择
    e.stopPropagation(); // 阻止事件冒泡
    this.selectedValues = [];
    this.updateDisplay();
    
    // 取消所有复选框
    const checkboxes = this.optionsContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    
    // 特殊处理品牌和商品下拉
    if (this.selector.id === 'brandSelector') {
      selectedProducts = [];
      filterProductsByBrand();
    } else if (this.selector.id === 'productSelector') {
      selectedProducts = [];
      filterProductsByBrand();
    }
  }

  handleOptionChange(e) { // 添加一个方法来处理选项的更改
    if (!e.target.matches('input[type="checkbox"]')) return; // 确保点击的是复选框
    
    const checkbox = e.target;
    const value = checkbox.value;
    
    // 全选处理
    if (checkbox.id.startsWith('selectAll')) {
      const checkboxes = this.optionsContainer.querySelectorAll(
        `input[type="checkbox"]:not([id="${checkbox.id}"])`
      );
      
      if (checkbox.checked) {
        this.selectedValues = this.allOptions.map(opt => opt.value);
        checkboxes.forEach(cb => cb.checked = true);
      } else {
        this.selectedValues = [];
        checkboxes.forEach(cb => cb.checked = false);
      }
    } 
    // 单个选项处理
    else {
      if (checkbox.checked) {
        if (!this.selectedValues.includes(value)) {
          this.selectedValues.push(value);
        }
      } else {
        const index = this.selectedValues.indexOf(value);
        if (index > -1) this.selectedValues.splice(index, 1);
      }
      
      // 更新全选状态
      this.updateSelectAllState();
    }
    
    this.updateDisplay();
    
    // 品牌下拉特殊处理
    if (this.selector.id === 'brandSelector') {
      selectedProducts = [];
      filterProductsByBrand();
      if (currentWarehouse === 'longqiao') { // 隆桥仓库模式下根据品牌过滤客户
        filterCustomersByBrand();
      }      
    }

    // 新增：仓库选择变化时，重新加载品牌和商品选项
    if (this.selector.id === 'warehouseSelector') {
      reloadBrandAndProductOptions();
    }    
  }

  updateDisplay() { // 更新显示
    const placeholderEl = this.selector.querySelector('.placeholder');
    const displayEl = this.selector.querySelector('.selected-display');
    const arrow = this.selector.querySelector('.arrow');
    
    displayEl.innerHTML = '';
    
    if (this.selectedValues.length === 0) {
      placeholderEl.textContent = `全部${this.placeholder}`;
      placeholderEl.style.display = 'block';
      displayEl.style.display = 'none';
      arrow.style.display = 'block';
      arrow.classList.replace('fa-times', 'fa-chevron-down');
      this.clearBtn.style.display = 'none';
      return;
    }
    
    placeholderEl.style.display = 'none';
    displayEl.style.display = 'flex';
    
    // 显示前5个选中项
    const maxDisplay = 5;
    const displayValues = this.selectedValues.slice(0, maxDisplay);
    const remainingCount = this.selectedValues.length - maxDisplay;
    
    displayValues.forEach(value => {
      const option = this.allOptions.find(opt => opt.value === value);
      if (!option) return;

      // 使用insertAdjacentHTML方法能被父元素监听
      displayEl.insertAdjacentHTML('beforeend', `
        <div class='tag' data-value='${value}'>
          ${option.label}
          <span class='tag-remove'><i class="far fa-circle-xmark"></i></span> 
        </div>
      `);      
    });
    
    // 显示剩余项提示
    if (remainingCount > 0) {
      const moreTag = document.createElement('div');
      moreTag.className = 'tag more-tag';
      moreTag.textContent = `...等${this.selectedValues.length}项`;
      displayEl.appendChild(moreTag);
    }
    
    // 更新图标状态
    arrow.style.display = 'none';
    this.clearBtn.style.display = 'block';
  }

  // 新增：重置选择
  reset() {
    this.selectedValues = [];
    this.updateDisplay();
    
    // 取消所有复选框
    const checkboxes = this.optionsContainer.querySelectorAll(
      'input[type="checkbox"]'
    );
    checkboxes.forEach(checkbox => (checkbox.checked = false));
  }

  // 新增：更新全选状态
  updateSelectAllState() {
    const selectAll = this.optionsContainer.querySelector(
      `input[id^="selectAll"]`
    );
    if (selectAll) {
      const checkboxes = this.optionsContainer.querySelectorAll(
        `input[type="checkbox"]:not([id^="selectAll"])`
      );
      selectAll.checked = checkboxes.length > 0 && 
        Array.from(checkboxes).every(cb => cb.checked);
    }
  }

  setOptions(options) {
    this.allOptions = options;
    this.renderOptions();
    this.updateDisplay();
  }

  renderOptions() { // 添加全选选项
    this.optionsContainer.innerHTML = '';
    
    // 添加全选选项
    const selectAllOption = document.createElement('div');
    selectAllOption.className = 'option';
    selectAllOption.innerHTML = `
      <input type="checkbox" id="selectAll${this.selector.id}">
      <label for="selectAll${this.selector.id}">全选</label>
    `;
    this.optionsContainer.appendChild(selectAllOption);
    
    // 添加普通选项
    this.allOptions.forEach(option => {
      const optionEl = document.createElement('div');
      optionEl.className = 'option';
      optionEl.innerHTML = `
        <input type="checkbox" id="${this.selector.id}-${option.value}" 
              value="${option.value}" ${this.selectedValues.includes(option.value) ? 'checked' : ''}>
        <label for="${this.selector.id}-${option.value}">${option.label}</label>
      `;
      this.optionsContainer.appendChild(optionEl);
    });
  }
}
// 新增：关闭所有下拉框函数
function closeAllDropdowns() {
  document.querySelectorAll('.options-container').forEach(dropdown => {
    dropdown.classList.remove('visible');
    const prevArrow = dropdown.previousElementSibling.querySelector('.arrow');
    if (prevArrow) {
      prevArrow.classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
  });
  currentOpenDropdown = null;
}

// 全局下拉框实例
let warehouseMultiSelect, brandMultiSelect, productMultiSelect, customerMultiSelect;

// ============== 6. 仓库/人员、品牌与商品过滤 ==============
// ****根据品牌过滤商品选项****
function filterProductsByBrand() {
  // 清空商品选项容器
  productOptions.innerHTML = '';

  // 添加全选选项
  const productSelectAllOption = document.createElement('div');
  productSelectAllOption.className = 'option';
  productSelectAllOption.id = 'productSelectAll';
  productSelectAllOption.innerHTML = `
    <input type="checkbox" id="selectAllProducts">
    <label for="selectAllProducts">全选</label>
  `;
  productOptions.appendChild(productSelectAllOption);

  let filteredProducts = [];
  let displayBrandCount = brandMultiSelect.selectedValues.length;

  // 根据品牌筛选商品
  if (displayBrandCount > 0) {
    filteredProducts = allProductsData.filter(p => 
      brandMap[p.product_id] && brandMultiSelect.selectedValues.includes(brandMap[p.product_id])
    );
  } else {
    filteredProducts = allProductsData;
    displayBrandCount = '全部';
  }

  // 重置商品选中状态
  productMultiSelect.selectedValues = [];
  
  // 添加商品选项
  filteredProducts.forEach(product => {
    const option = document.createElement('div');
    option.className = 'option';
    const isSelected = productMultiSelect.selectedValues.includes(product.product_id);
    
    option.innerHTML = `
      <input type="checkbox" id="product-${product.product_id}" 
             value="${product.product_id}" ${isSelected ? 'checked' : ''}>
      <label for="product-${product.product_id}">${product.product_name}</label>
    `;
    productOptions.appendChild(option);
  });

  // 更新商品下拉框文本
  const placeholderEl = productSelector.querySelector('.placeholder');
  placeholderEl.textContent = brandMultiSelect.selectedValues.length === 0 
    ? '全部商品' 
    : `已筛选${displayBrandCount}个品牌`;
  
  // 更新商品下拉框选项
  productMultiSelect.setOptions(
    filteredProducts.map(p => ({ 
      value: p.product_id, 
      label: p.product_name 
    })).sort((a, b) => a.label.localeCompare(b.label)) // 按A-Z排序
  );
}

// **** 根据品牌过滤客户函数 **** 
function filterCustomersByBrand() { 
  const selectedBrands = brandMultiSelect.selectedValues;
  const selectedSales = warehouseMultiSelect.selectedValues; // 获取选中的销售人员
  
  // 使用全局 salesRecords 作为基础
  let filteredCustomers = [];
  
  if (selectedBrands.length > 0 || selectedSales.length > 0) {
    filteredCustomers = allCustomers.filter(customer => {
      // 检查该客户是否有匹配的记录
      return salesRecords.some(record => 
        record.customer === customer && 
        // 同时匹配品牌和销售人员
        (selectedBrands.length === 0 || selectedBrands.includes(record.brand)) &&
        (selectedSales.length === 0 || selectedSales.includes(record.sales))
      );
    });
  } else {
    // 没有品牌选中时显示所有客户
    filteredCustomers = allCustomers;
  }
  
  // 更新客户下拉框选项
  customerMultiSelect.setOptions(
    filteredCustomers.map(c => ({ value: c, label: c }))
      .sort((a, b) => a.label.localeCompare(b.label))
  );
  
  // 重置客户选择状态
  if (customerMultiSelect) {
    customerMultiSelect.reset();
  }
}

// ****按仓库/人员，重新加载品牌和商品选项****
function reloadBrandAndProductOptions() {
  // 直接使用全局的 salesRecords 数据
  if (!salesRecords || salesRecords.length === 0) {
    return;
  }

  try {
    // === 新增：按仓库筛选数据 ===
    let filteredRecords = [...salesRecords];
    
    //  按仓库类型过滤
    if (currentWarehouse === 'longqiao') {
      // 隆桥仓库：按销售人员过滤
      if (warehouseMultiSelect.selectedValues.length > 0) {
        filteredRecords = filteredRecords.filter(record => 
          warehouseMultiSelect.selectedValues.includes(record.sales)
        );
      }
    } else {
      // 多多仓库：按仓库名称过滤
      if (warehouseMultiSelect.selectedValues.length > 0) {
        filteredRecords = filteredRecords.filter(record => 
          warehouseMultiSelect.selectedValues.includes(record.warehouse)
        );
      }
    }

    // === 处理商品和品牌数据 ===
    const uniqueProducts = new Map();
    brandMap = {}; // 重置品牌映射
    
    filteredRecords.forEach(record => {
      // 仅处理有商品ID的记录
      if (record.product_id) {
        // 存储商品信息
        if (!uniqueProducts.has(record.product_id)) {
          uniqueProducts.set(record.product_id, {
            product_id: record.product_id,
            product_name: record.product_name || '未知商品'
          });
        }
        
        // 存储品牌映射（包含默认值）
        brandMap[record.product_id] = record.brand || '无品牌';
      }
    });
    
    allProductsData = Array.from(uniqueProducts.values());
    allBrands = [...new Set(Object.values(brandMap))].sort();

    // 更新品牌下拉框选项
    brandMultiSelect.setOptions(
      allBrands.map(brand => ({ value: brand, label: brand }))
        .sort((a, b) => a.label.localeCompare(b.label)) // 按A-Z排序
    );
    
    // 更新商品下拉框选项（根据当前品牌选择过滤）
    filterProductsByBrand();
    
    // === 新增：隆桥仓库模式下更新客户选项 ===
    if (currentWarehouse === 'longqiao') {
      // 获取唯一客户列表
      const uniqueCustomers = [...new Set(filteredRecords
        .map(record => record.customer)
        .filter(c => c) // 过滤空值
      )].sort();
      
      // 更新客户下拉框
      customerMultiSelect.setOptions(
        uniqueCustomers.map(customer => ({ 
          value: customer, 
          label: customer 
        })).sort((a, b) => a.label.localeCompare(b.label)) // 按A-Z排序
      );
      if (customerMultiSelect) {   // 重置客户选择状态 
        customerMultiSelect.reset();
      } 
      if (brandMultiSelect) {   // 重置品牌选择状态 
        brandMultiSelect.reset();
      }            
    }
    
  } catch (error) {
    console.error('重新加载品牌和商品选项失败:', error);
  }
}

// ============== 7. 数据加载与处理 ==============
// ****通用数据获取函数（支持分页）*****
async function fetchRecords(tableName, fields, conditions = {}) {
  if (!supabaseClient) {
    throw new Error('Supabase客户端未初始化');
  }

  try {
    const batchSize = 10000; // 每批次获取的记录数
    let allData = []; // 存储所有数据
    let from = 0; // 起始位置
    let hasMore = true; // 是否还有更多数据

    // 构建基础查询
    let baseQuery = supabaseClient
      .from(tableName)
      .select(fields.join(','));

    // 应用查询条件
    Object.entries(conditions).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        baseQuery = baseQuery.in(key, value);
      } else if (value !== undefined) {
        if (typeof value === 'object' && value.gte && value.lte) {
          baseQuery = baseQuery.gte(key, value.gte).lte(key, value.lte);
        } else {
          baseQuery = baseQuery.eq(key, value);
        }
      }
    });

    // 分批次获取所有数据
    while (hasMore) {
      // 创建当前批次的查询（复制基础查询并添加范围限制）
      let query = baseQuery.range(from, from + batchSize - 1);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // 添加当前批次的数据
      if (data && data.length > 0) {
        allData = [...allData, ...data];
      }
      
      // 检查是否还有更多数据
      hasMore = data.length === batchSize;
      from += batchSize;
    }
    return allData;
  } catch (error) {
    console.error(`从 ${tableName} 获取数据失败:`, error);
    throw error;
  }
}

// 加载筛选选项函数，在加载完成后检查品牌数量并自动应用单品牌逻辑
async function loadFilterOptions() {
  if (!supabaseClient) {
    showRoundedAlert('错误: Supabase客户端未初始化', 'error');
    return;
  }

  try {
    // 显示悬浮加载动画
    loadingEl.style.display = 'block';
    showLoadingOverlay(); // 添加遮罩层
        
    // 获取当前日期范围
    const startDate = startDateEl.value;
    const endDate = endDateEl.value ;
    
    // 根据当前仓库选择不同的查询表
    const table = currentWarehouse === 'longqiao' ? 'longqiao_records' : 'sales_records';
    // 设置查询字段（所有）
    const fields = currentWarehouse === 'longqiao'
      ? ['sale_date', 'product_id', 'product_name', 'sales', 'quantity', 'customer', 'amount', 'cost', 'brand']
      : ['sale_date', 'product_id', 'product_name', 'warehouse', 'quantity', 'unit_price', 'brand', 'pieces'];

    // 构建查询条件（只查询当前日期范围内的记录）
    const conditions = {
      sale_date: { gte: startDate, lte: endDate }
    };
    console.time('filter-query');
    // 使用通用函数获取数据
    salesRecords = await fetchRecords(table, fields, conditions);
    console.timeEnd('filter-query');
    // 处理仓库数据
    if (salesRecords.length > 0) {
      const warehouseKey = currentWarehouse === 'longqiao' ? 'sales' : 'warehouse';
      allWarehouses = [...new Set(salesRecords.map(record => record[warehouseKey]))]
        .filter(wh => wh) // 过滤掉空值
        .sort();
    }
    
    // 处理品牌和商品数据
    brandMap = {};
    
    if (salesRecords.length > 0) {
      const uniqueProducts = new Map();
    
      salesRecords.forEach(record => {
        if (record.product_id && !uniqueProducts.has(record.product_id)) {
          uniqueProducts.set(record.product_id, {
            product_id: record.product_id,
            product_name: record.product_name
          });
        }
        
        if (record.product_id && record.brand) {
          brandMap[record.product_id] = record.brand;
        }
      });
      
      allProductsData = Array.from(uniqueProducts.values());
      allBrands = [...new Set(salesRecords.map(record => record.brand))]
        .filter(b => b) // 过滤掉空值
        .sort();
    }

    // 处理客户数据（仅隆桥仓库）
    if (currentWarehouse === 'longqiao' && salesRecords.length > 0) {
      allCustomers = [...new Set(salesRecords.map(record => record.customer))]
        .filter(c => c) // 过滤掉空值
        .sort();
    }
 
    // 初始化多选下拉框实例
    warehouseMultiSelect = new MultiSelect(warehouseSelector, warehouseOptions, 
      currentWarehouse === 'longqiao' ? '销售人员' : '仓库');
    brandMultiSelect = new MultiSelect(brandSelector, brandOptions, '品牌');
    productMultiSelect = new MultiSelect(productSelector, productOptions, '商品');
  
    // 客户下拉框初始化（无论是否有数据都初始化）
    customerMultiSelect = new MultiSelect(customerSelector, customerOptions, '客户');
    customerMultiSelect.setOptions(
      allCustomers.map(c => ({ value: c, label: c }))
        .sort((a, b) => a.label.localeCompare(b.label)) // 按A-Z排序      
    );

    // 设置下拉框选项
    warehouseMultiSelect.setOptions(
      allWarehouses.map(wh => ({ value: wh, label: wh }))
        .sort((a, b) => a.label.localeCompare(b.label)) // 按A-Z排序
    );
    
    brandMultiSelect.setOptions(
      allBrands.map(brand => ({ value: brand, label: brand }))
        .sort((a, b) => a.label.localeCompare(b.label)) // 按A-Z排序
    );
    
    // 初始商品选项
    productMultiSelect.setOptions(
      allProductsData.map(p => ({ value: p.product_id, label: p.product_name }))
        .sort((a, b) => a.label.localeCompare(b.label)) // 按A-Z排序
    );
    
    // 新增：检查是否只有一个品牌，如果是则自动应用单品牌逻辑
    if (currentWarehouse === 'longqiao' && allBrands.length === 1) {
      // 自动触发单品牌逻辑
      setTimeout(() => {
        loadData();
      }, 0);
    }
    
    return Promise.resolve();
  } catch (error) {
    showRoundedAlert('筛选选项加载失败: ' + error.message, 'error');
    return Promise.reject(error);
  } finally {
    // 隐藏加载动画
    loadingEl.style.display = 'none';
    hideLoadingOverlay(); // 移除遮罩层
  } 
}

// 加载数据
function loadData() {
  // +++ 新增：收起详细记录区域 +++
  if (detailSection.classList.contains('visible')) {
    detailSection.classList.remove('visible');
    // 更新图标方向
    const icon = document.querySelector('#toggleDetails i');
    icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
  }

  // 清除表格和饼图内容
  summaryTable.innerHTML = '';
  detailTable.innerHTML = '';
  clearPieChart(); 

  try { 

    // 直接使用全局 salesRecords 数据
    let data = salesRecords; 
    // 仓库/销售人员过滤
    if (currentWarehouse === 'longqiao') {
      if (warehouseMultiSelect.selectedValues.length > 0) {
        data = data.filter(record => 
          warehouseMultiSelect.selectedValues.includes(record.sales)
        );
      }
    } else {
      if (warehouseMultiSelect.selectedValues.length > 0) {
        data = data.filter(record => 
          warehouseMultiSelect.selectedValues.includes(record.warehouse)
        );
      }
    }
    
    // 品牌过滤
    if (brandMultiSelect.selectedValues.length > 0) {
      data = data.filter(record => 
        brandMultiSelect.selectedValues.includes(record.brand)
      );
    }
    
    // 商品过滤
    if (productMultiSelect.selectedValues.length > 0) {
      data = data.filter(record => 
        productMultiSelect.selectedValues.includes(record.product_id)
      );
    }
    
    // 客户过滤（仅隆桥仓库）
    if (currentWarehouse === 'longqiao' && 
        customerMultiSelect && 
        customerMultiSelect.selectedValues.length > 0) {
      data = data.filter(record => 
        customerMultiSelect.selectedValues.includes(record.customer)
      );
    }

    calculateSummary(data);
    // 更新详细记录条数但不渲染表格
    renderDetailTable(data, false);    

  } catch (error) {
    console.error('查询错误详情:', error);
    loadingEl.innerHTML = `
      <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="color: #e53e3e; font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">数据加载失败</p>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// 渲染详细表格
function renderDetailTable(data, shouldRender = false) {
  // 获取显示数据条数的元素
  const detailCountEl = document.getElementById('detailCount');
  
  // 始终更新数据条数显示，无论是否渲染表格
  if (!data || data.length === 0) {
    detailCountEl.textContent = '(0条数据)';
  } else {
    detailCountEl.textContent = `(${data.length}条)`;
  }
  
  // 如果不需要渲染，直接返回
  if (!shouldRender) {
    return;
  }
  
  // 使用 setTimeout 将渲染操作放到下一个事件循环中，确保加载动画能够显示
  setTimeout(() => {
    try {
      console.time('renderDetailTable');
      const tbody = detailTable;
      tbody.innerHTML = '';

      // 修改点：按时间从大到小排序
      if (data && data.length > 0) {
        data.sort((a, b) => {
          return new Date(b.sale_date) - new Date(a.sale_date);
        });
      }

      if (!data || data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="${currentWarehouse === 'longqiao' ? 9 : 8}" style="text-align: center; padding: 30px; color: #6c757d;">
              <i class="fas fa-database" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
              未找到匹配的记录
            </td>
          </tr>
        `;
        return;
      }

      data.forEach(record => {
        const row = document.createElement('tr');
        let amount, warehouseField, cost;
        
        if (currentWarehouse === 'longqiao') {
          amount = record.amount || 0;
          warehouseField = record.sales || '--';
          cost = record.cost || 0;
        } else {
          amount = (record.quantity || 0) * (record.unit_price || 0);
          warehouseField = record.warehouse || '--';
          cost = record.unit_price || 0;
        }
        
        // 基础行
        row.innerHTML = `
          <td>${record.sale_date || '--'}</td>
          <td>${ //第二列显示商品ID或客户名称
            currentWarehouse === 'longqiao' 
              ? (record.customer || '--')  // 隆桥仓库显示客户名称
              : (record.product_id || '--') // 其他仓库显示商品ID
          }</td>
          <td>${record.product_name || '--'}</td>
          <td>${record.brand || '--'}</td>
          <td>${warehouseField}</td>
          <td>${formatNumber(record.quantity || 0)}</td>
          <td>${cost}</td>
          <td>¥${formatNumber(amount)}</td>
        `;
        
        // 隆桥仓库显示利润列
        if (currentWarehouse === 'longqiao') {
          const profit = (record.amount || 0) - (record.cost || 0);
          const profitStyle = profit < 0 ? 'style="color: #e53e3e; font-weight: bold;"' : '';
          row.innerHTML += `<td ${profitStyle}>¥${formatNumber(profit)}</td>`;
        }
        
        tbody.appendChild(row);
      });
      console.timeEnd('renderDetailTable');
    } catch (error) {
      console.error('渲染详细表格时出错:', error);
      detailTable.innerHTML = `
        <tr>
          <td colspan="${currentWarehouse === 'longqiao' ? 9 : 8}" style="text-align: center; padding: 30px; color: #e53e3e;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
            <p>渲染表格时发生错误</p>
          </td>
        </tr>
      `;
    }
  }, 0);
}

// 获取当前筛选后的数据
function getFilteredData() {
  // 重新获取当前筛选后的数据
  let data = salesRecords;
  
  // 应用相同的筛选逻辑
  if (currentWarehouse === 'longqiao') {
    if (warehouseMultiSelect.selectedValues.length > 0) {
      data = data.filter(record => 
        warehouseMultiSelect.selectedValues.includes(record.sales)
      );
    }
  } else {
    if (warehouseMultiSelect.selectedValues.length > 0) {
      data = data.filter(record => 
        warehouseMultiSelect.selectedValues.includes(record.warehouse)
      );
    }
  }
  
  if (brandMultiSelect.selectedValues.length > 0) {
    data = data.filter(record => 
      brandMultiSelect.selectedValues.includes(record.brand)
    );
  }
  
  if (productMultiSelect.selectedValues.length > 0) {
    data = data.filter(record => 
      productMultiSelect.selectedValues.includes(record.product_id)
    );
  }
  
  if (currentWarehouse === 'longqiao' && 
      customerMultiSelect && 
      customerMultiSelect.selectedValues.length > 0) {
    data = data.filter(record => 
      customerMultiSelect.selectedValues.includes(record.customer)
    );
  }
  
  return data;
}

// 显示详细记录表格
function showDetailTable() {
  // 显示悬浮加载动画
  if (loadingEl) {
    loadingEl.style.display = 'block';
    showLoadingOverlay(); // 添加遮罩层
  }

  // 只有当详细记录区域可见时才渲染表格
  if (detailSection.classList.contains('visible')) {
    // 获取筛选后的数据
    const data = getFilteredData();
    
    // 渲染表格
    renderDetailTable(data, true);
    
    // 在渲染完成后隐藏加载动画
    setTimeout(() => {
      if (loadingEl) {
        loadingEl.style.display = 'none';
        hideLoadingOverlay(); // 移除遮罩层
      }
    }, 300);
  } else {
    // 如果详细记录区域不显示，直接隐藏加载动画
    if (loadingEl) {
      loadingEl.style.display = 'none';
      hideLoadingOverlay(); // 移除遮罩层
    }
  }
}

// 修改 calculateSummary 函数中的汇总逻辑
function calculateSummary(data) {
  const summaryTableEl = document.getElementById('summaryTable');
  let thead = summaryTableEl.querySelector('thead');
  if (!thead) {
    thead = document.createElement('thead');
    summaryTableEl.insertBefore(thead, summaryTableEl.firstChild);
  }

  // 根据仓库类型设置表头
  let headerHTML = `<tr><th>品牌</th><th>总件数</th><th>总金额</th>`;
  if (currentWarehouse === 'longqiao') {
      headerHTML += `<th>总毛利</th><th>费用发放</th>`;
  }
  headerHTML += `</tr>`;
  thead.innerHTML = headerHTML;

  let tbody = summaryTableEl.querySelector('tbody');
  if (!tbody) {
      tbody = document.createElement('tbody');
      summaryTableEl.appendChild(tbody);
  }

  if (!data || data.length === 0) {
    totalQuantityEl.textContent = '0';
    totalAmountEl.textContent = '¥0.00';
    totalProductsEl.textContent = '0';
    totalBrandsEl.textContent = '0';
    
    // 隆桥仓库显示利润
    if (currentWarehouse === 'longqiao') {
      totalProfitEl.textContent = '¥0.00';
    }
    // 根据仓库类型决定列数
    const colCount = currentWarehouse === 'longqiao' ? 5 : 3;    
    tbody.innerHTML = `
      <tr>
          <td colspan="${colCount}" style="text-align: center; padding: 30px; color: #6c757d;">
          <i class="fas fa-chart-bar" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
          无汇总数据
        </td>
      </tr>
    `;
    return;
  }

  // 初始化统计变量
  let totalQuantity = 0; // 总销量
  let totalAmount = 0; // 总金额
  let totalProfit = 0; // 总利润
  let freeIssueAmount = 0;  // 费用发放
  const uniqueBrands = new Set(); //品牌统计
  const uniqueProducts = new Set(); //商品统计
  const summaryMap = new Map(); // 汇总数据

  // 单次遍历完成所有统计
  data.forEach(record => {
    // 统计商品和品牌
    if (record.product_id) uniqueProducts.add(record.product_id);
    if (record.brand) uniqueBrands.add(record.brand);

    // 计算金额和数量
    let amount, cost;
    if (currentWarehouse === 'longqiao') {
      amount = record.amount || 0;
      cost = record.cost || 0;
      
      // 费用发放记录（销售额为0）
      if (amount === 0) {
        freeIssueAmount += cost;
      } else { // 正常销售记录
        const quantity = record.quantity || 0;
        totalQuantity += quantity;
        totalAmount += amount;
        totalProfit += amount - cost;
      }
    } else { // 多多仓库
      const pieces = record.pieces || 0; // 使用pieces字段
      const quantity = record.quantity || 0;
      const unitPrice = record.unit_price || 0;
      amount = quantity * unitPrice;
      totalQuantity += pieces; // 累加pieces而非quantity
      totalAmount += amount;
      cost = unitPrice;
    }

    // 按品牌汇总（只处理正常销售记录）
    if (currentWarehouse !== 'longqiao' || amount !== 0) {
      const brand = record.brand || '未知品牌';
      
      if (!summaryMap.has(brand)) {
        summaryMap.set(brand, {
          brand: brand,
          total_quantity: 0,
          total_amount: 0,
          total_cost: 0,
          profit: 0,
          free_issue: 0  // 新增：记录该品牌的费用发放金额
        });
      }
      // 更新汇总数据
      const summary = summaryMap.get(brand); 
      if (currentWarehouse === 'longqiao') {
        summary.total_quantity += record.quantity || 0;
        summary.total_amount += amount;
        summary.total_cost += cost;
        summary.profit += amount - cost;
      } else {
        summary.total_quantity += record.pieces || 0; // 使用pieces字段
        summary.total_amount += amount;
      }
    }

    // 按品牌汇总费用发放记录（amount=0）
    if (currentWarehouse === 'longqiao' && amount === 0) {
      const brand = record.brand || '未知品牌';
      
      if (!summaryMap.has(brand)) {
        summaryMap.set(brand, {
          brand: brand,
          total_quantity: 0,
          total_amount: 0,
          total_cost: 0,
          profit: 0,
          free_issue: 0
        });
      }  
      const summary = summaryMap.get(brand);
      summary.free_issue += cost;  // 累加费用发放
    }
  });

  // 检查是否为隆桥仓库且只有一个品牌
  const isSingleBrandInLongqiao = currentWarehouse === 'longqiao' && 
    (uniqueBrands.size === 1 || allBrands.length === 1);
  const singleBrandName = uniqueBrands.size === 1 ? 
    Array.from(uniqueBrands)[0] : 
    (allBrands.length === 1 ? allBrands[0] : null);

  // 如果是隆桥仓库且只有一个品牌，则按销售人员汇总
  if (isSingleBrandInLongqiao && singleBrandName) {
    // 重新构建按销售人员的汇总数据
    const salesSummaryMap = new Map();
    
    // 初始化统计变量（用于卡片显示）
    let salesTotalQuantity = 0;
    let salesTotalAmount = 0;
    let salesTotalProfit = 0;
    let salesFreeIssueAmount = 0;
    const salesUniqueProducts = new Set(); // 按销售人员统计的商品种类
    
    data.forEach(record => {
      // 只处理与该品牌相关的记录
      if (record.brand === singleBrandName) {
        // 统计商品种类
        if (record.product_id) salesUniqueProducts.add(record.product_id);
        
        let amount, cost;
        if (currentWarehouse === 'longqiao') {
          amount = record.amount || 0;
          cost = record.cost || 0;
          
          const sales = record.sales || '未知销售人员';
          
          if (!salesSummaryMap.has(sales)) {
            salesSummaryMap.set(sales, {
              sales: sales,
              total_quantity: 0,
              total_amount: 0,
              total_cost: 0,
              profit: 0,
              free_issue: 0
            });
          }
          
          const summary = salesSummaryMap.get(sales);
          
          if (amount === 0) {
            // 费用发放记录
            summary.free_issue += cost;
            salesFreeIssueAmount += cost;
          } else {
            // 正常销售记录
            const quantity = record.quantity || 0;
            summary.total_quantity += quantity;
            summary.total_amount += amount;
            summary.profit += amount - cost;
            
            salesTotalQuantity += quantity;
            salesTotalAmount += amount;
            salesTotalProfit += amount - cost;
          }
        }
      }
    });
    
    // 更新统计卡片（按销售人员数据）
    totalQuantityEl.textContent = formatNumber(salesTotalQuantity);
    totalAmountEl.textContent = `¥${formatNumber(salesTotalAmount)}`;
    totalProfitEl.textContent = `¥${formatNumber(salesTotalProfit)}`;
    totalBrandsEl.textContent = `¥${formatNumber(salesFreeIssueAmount)}`;
    totalBrandsEl.style.color = '#e53e3e';
    totalProductsEl.textContent = formatNumber(salesUniqueProducts.size); // 更新商品种类数
    
    const statLabels = document.querySelectorAll('.stat-card .stat-label');
    statLabels[3].textContent = '费用发放';
    salesTotalProfit <= 0 ? totalProfitEl.style.color = '#e53e3e' : totalProfitEl.style.color = '#4361ee';
    
    // 更新表头为销售人员
    thead.innerHTML = `<tr><th>销售人员</th><th>总件数</th><th>总金额</th><th>总毛利</th><th>费用发放</th></tr>`;
    
    // 按销售额从大到小排序
    const sortedSummaries = Array.from(salesSummaryMap.values()).sort((a, b) => 
      b.total_amount - a.total_amount
    );
    
    // 渲染汇总表格
    tbody.innerHTML = ''; // 清空 tbody 而不是整个表格 
    
    sortedSummaries.forEach(summary => {
      const row = document.createElement('tr');
      const profitStyle = summary.profit < 0 
          ? 'style="color: #e53e3e; font-weight: bold;"' 
          : '';
      
      row.innerHTML = `
          <td>${summary.sales}</td>
          <td>${formatNumber(summary.total_quantity)}</td>
          <td>¥${formatNumber(summary.total_amount)}</td>
          <td ${profitStyle}>¥${formatNumber(summary.profit)}</td> 
          <td>¥${formatNumber(summary.free_issue)}</td> 
      `;
      tbody.appendChild(row);
    });
    
    // 渲染饼图（按销售人员）
    if (sortedSummaries.length > 0) {
      renderSalesPieChart(sortedSummaries);
    } else {
      clearPieChart();
    }
  } else {
    // 原有逻辑：按品牌汇总
    
    // 更新统计卡片
    totalQuantityEl.textContent = formatNumber(totalQuantity);
    totalAmountEl.textContent = `¥${formatNumber(totalAmount)}`;
    
    const statLabels = document.querySelectorAll('.stat-card .stat-label');
    if (currentWarehouse === 'longqiao') {
      totalBrandsEl.textContent = `¥${formatNumber(freeIssueAmount)}`;
      totalBrandsEl.style.color = '#e53e3e';
      statLabels[3].textContent = '费用发放';
      totalProfit <= 0 ? totalProfitEl.style.color = '#e53e3e' : '#4361ee';
      totalProfitEl.textContent = `¥${formatNumber(totalProfit)}`;
    } else {
      totalBrandsEl.textContent = formatNumber(uniqueBrands.size);
      totalBrandsEl.style.color = '';
      statLabels[3].textContent = '品牌数量';
    }
    
    totalProductsEl.textContent = formatNumber(uniqueProducts.size);
    
    // 按销售额从大到小排序
    const sortedSummaries = Array.from(summaryMap.values()).sort((a, b) => 
      b.total_amount - a.total_amount
    );
    
    // 渲染汇总表格
    tbody.innerHTML = ''; // 清空 tbody 而不是整个表格 
    
    sortedSummaries.forEach(summary => {
      const row = document.createElement('tr');
      let rowHTML = `
          <td>${summary.brand}</td>
          <td>${formatNumber(summary.total_quantity)}</td>
          <td>¥${formatNumber(summary.total_amount)}</td>
      `;
      
      if (currentWarehouse === 'longqiao') {
          const profitStyle = summary.profit < 0 
              ? 'style="color: #e53e3e; font-weight: bold;"' 
              : '';
          
          rowHTML += `
              <td ${profitStyle}>¥${formatNumber(summary.profit)}</td> 
              <td>¥${formatNumber(summary.free_issue)}</td> 
          `;
      }
      
      row.innerHTML = rowHTML;
      tbody.appendChild(row);
    });
    
    // 渲染饼图
    if (data && data.length > 0) {
      renderBrandPieChart(sortedSummaries);
    } else {
      clearPieChart(); // 新增：清空饼图
    }
  }

  setTimeout(() => {
    syncContainersDimensions();
  }, 0);  
}

// 新增：按销售人员渲染饼图的函数
function renderSalesPieChart(salesSummaries) {
  const chartContainer = document.getElementById('chartContainer');
  
  // 清空容器
  chartContainer.innerHTML = salesSummaries.length > 0 
    ? '<canvas id="brandChart"></canvas>' 
    : '<div class="no-chart-data">无销售人员数据可展示</div>';
  
  if (salesSummaries.length === 0) return;
  
  const ctx = document.getElementById('brandChart').getContext('2d');
  if (!ctx) {
    return;
  }  
  
  // 饼图颜色生成器 
  const generateColors = (count) => {
    const baseColors = [
      '#4BC0C0', // 青色
      '#f54444ff', // 红色
      '#36A2EB', // 蓝色
      '#F15BB5',  // 粉红        
      '#FFCE56', // 黄色
      '#26cd3cff', // 绿色
      '#9966FF', // 紫色
      '#FF9F40', // 橙色
      '#1982C4', // 深蓝
      '#6A4C93' // 深紫
    ];
    
    // 当销售人员数量超过基础颜色时，生成随机颜色
    if (count > baseColors.length) {
      for (let i = baseColors.length; i < count; i++) {
        baseColors.push(`#${Math.floor(Math.random()*16777215).toString(16)}`);
      }
    }
    
    return baseColors.slice(0, count);
  };
  
  // 创建饼图
  const chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: salesSummaries.map(item => item.sales),
      datasets: [{
        data: salesSummaries.map(item => item.total_amount),
        backgroundColor: generateColors(salesSummaries.length),
        borderWidth: 1,
        borderColor: '#fff',
        hoverOffset: 15,
        radius: '95%' // 设置饼图大小为95%
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: { 
              size: 12,
              weight: 'bold'
            },
            padding: 15,
            usePointStyle: true,
            color: '#333'
          }
        },
        title: {
          display: true,
          text: '销售人员销售金额占比',
          font: {
            size: 18,
            weight: 'bold'
          },
          color: '#222',
          padding: {
            top: 20,
            bottom: 15
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 12
          },
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart.getDatasetMeta(0).total;
              const percentage = Math.round((value / total) * 100);
              return `${label}: ¥${formatNumber(value)} (${percentage}%)`;
            }
          }
        },
        datalabels: {
          display: true,
          formatter: (value, ctx) => {
            const total = ctx.chart.getDatasetMeta(0).total;
            const percentage = Math.round((value / total) * 100);
            const label = ctx.chart.data.labels[ctx.dataIndex];
            
            if (percentage < 5) return null;
            
            return `${label}\n${percentage}%`;
          },
          color: '#222',
          font: {
            weight: 'bold',
            size: window.innerWidth <= 768 ? 8 : 12
          },
          align: 'end',
          anchor: 'center',
          offset: 0,
          clip: false,
          textAlign: 'center',
          padding: 2
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true
      }
    },
    plugins: [ChartDataLabels]
  });

  // 存储图表实例以便后续调整
  chartContainer.chartInstance = chart;
}

// 同步容器尺寸函数
function syncContainersDimensions() {
  const tableContainer = document.querySelector('.summary-table-container');
  const chartContainer = document.querySelector('.chart-container');
  
  if (tableContainer && chartContainer) {
    // 获取左侧表格的实际高度
    const tableHeight = tableContainer.offsetHeight;
    
    // 设置右侧图表容器高度
    chartContainer.style.height = `${tableHeight}px`;
    
    // 如果图表已渲染，重新调整大小
    if (chartContainer.chartInstance) {
      chartContainer.chartInstance.resize();
    }
  }
}

// ======= 新增: 饼图渲染函数 =======
function renderBrandPieChart(brandSummaries) {
  const chartContainer = document.getElementById('chartContainer');
  
  // 清空容器
  chartContainer.innerHTML = brandSummaries.length > 0 
    ? '<canvas id="brandChart"></canvas>' 
    : '<div class="no-chart-data">无品牌数据可展示</div>';
  
  if (brandSummaries.length === 0) return;
  
  const ctx = document.getElementById('brandChart').getContext('2d');
  if (!ctx) {
    return;
  }  
  
  // 饼图颜色生成器 
  const generateColors = (count) => {
    if (currentWarehouse === 'longqiao') {
       baseColors = [
        '#4BC0C0', // 青色
        '#f54444ff', // 红色
        '#36A2EB', // 蓝色
        '#F15BB5',  // 粉红        
        '#FFCE56', // 黄色
        '#26cd3cff', // 绿色
        '#9966FF', // 紫色
        '#FF9F40', // 橙色
        '#1982C4', // 深蓝
        '#6A4C93' // 深紫
      ];      
    }else {
       baseColors = [
        '#26cd3cff', // 绿色
        '#FFCE56', // 黄色
        '#f54444ff', // 红色
        '#36A2EB', // 蓝色
        '#F15BB5',  // 粉红      
        '#9966FF', // 紫色
        '#FF9F40', // 橙色
        '#6A4C93', // 深紫
        '#4BC0C0', // 青色
        '#1982C4' // 深蓝
      ];
    }
    // 当品牌数量超过基础颜色时，生成随机颜色
    if (count > baseColors.length) {
      for (let i = baseColors.length; i < count; i++) {
        baseColors.push(`#${Math.floor(Math.random()*16777215).toString(16)}`);
      }
    }
    
    return baseColors.slice(0, count);
  };
  
  // 创建饼图
  const chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: brandSummaries.map(item => item.brand),
      datasets: [{
        data: brandSummaries.map(item => item.total_amount),
        backgroundColor: generateColors(brandSummaries.length),
        borderWidth: 1,
        borderColor: '#fff',
        hoverOffset: 15,
        radius: '95%' // 设置饼图大小为95%
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: { 
              size: 12,
              weight: 'bold'
            },
            padding: 15,
            usePointStyle: true,
            color: '#333'
          }
        },
        title: {
          display: true,
          text: '品牌销售金额占比',
          font: {
            size: 18,
            weight: 'bold'
          },
          color: '#222',
          padding: {
            top: 20,
            bottom: 15
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 12
          },
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart.getDatasetMeta(0).total;
              const percentage = Math.round((value / total) * 100);
              return `${label}: ¥${formatNumber(value)} (${percentage}%)`;
            }
          }
        },
        datalabels: {
          display: true,
          formatter: (value, ctx) => {
            const total = ctx.chart.getDatasetMeta(0).total;
            const percentage = Math.round((value / total) * 100);
            const label = ctx.chart.data.labels[ctx.dataIndex];
            
            if (percentage < 5) return null;
            
            return `${label}\n${percentage}%`;
          },
          color: '#222',
          font: {
            weight: 'bold',
            size: window.innerWidth <= 768 ? 8 : 12
          },
          align: 'end',
          anchor: 'center',
          offset: 0,
          clip: false,
          textAlign: 'center',
          padding: 2
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true
      }
    },
    plugins: [ChartDataLabels]
  });

  // 存储图表实例以便后续调整
  chartContainer.chartInstance = chart;
}

// ============== 8. 其他功能 ==============

// ***清除饼图函数 ***
function clearPieChart() {
  const chartContainer = document.getElementById('chartContainer');
  chartContainer.innerHTML = '<div class="no-chart-data">无品牌数据可展示</div>';
  
  // 清除图表实例引用
  if (chartContainer.chartInstance) {
    chartContainer.chartInstance.destroy();
    chartContainer.chartInstance = null;
  }
}

// ****【清除筛选】按扭函数****
function clearFilters() {
  // 使用reset方法重置选择状态（避免重新初始化）
  warehouseMultiSelect.reset();
  brandMultiSelect.reset();
  productMultiSelect.reset();
  if (customerMultiSelect) { // 重置客户下拉框
    customerMultiSelect.reset();
  }
  
  // 重置商品列表
  filterProductsByBrand();

  // 清除饼图数据
  clearPieChart();  
  
  // 重新设置默认日期
  setDefaultDates();
  
  loadFilterOptions().then(() => {
      loadData();
    })
}

// 切换详细记录显示
function toggleDetailSection() {
  detailSection.classList.toggle('visible');
  
  // 更新图标方向
  const icon = document.querySelector('#toggleDetails i');
  if (detailSection.classList.contains('visible')) {
    icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
    // +++ 新增：显示时渲染表格 +++
    showDetailTable();
  } else {
    icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    // 隐藏时清除表格内容
    if (detailTable) {
      detailTable.innerHTML = '';
    }
  }
}

// **** 新增遮罩层函数 ****
function showLoadingOverlay() {
  // 创建或获取遮罩层
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(255, 255, 255, 0.2);
      z-index: 999;
      display: flex;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(2px);
    `;
    document.body.appendChild(overlay);
  } else {
    overlay.style.display = 'flex';
  }
}

// **** 移除遮罩层函数 ****
function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// ============== 9. 页面初始化 ==============
document.addEventListener('DOMContentLoaded', async () => {
  if (!supabaseClient) {
    console.error('错误: Supabase客户端未正确初始化');
    queryBtn.disabled = true;
    queryBtn.textContent = '系统未初始化';
    queryBtn.style.background = '#e53e3e';
    queryBtn.style.cursor = 'not-allowed';
    loadingEl.innerHTML = '<p style="color: #e53e3e; padding: 1rem;">系统初始化失败，请刷新页面</p>';
    loadingEl.style.display = 'block';
    return;
  }
  
  // 初始化认证状态
  const isAuthenticated = await initAuth();
  // 添加切换仓库按钮事件监听
  document.getElementById('switchWarehouseBtn').addEventListener('click', switchWarehouse);
  
  // 无论是否已登录，都要设置用户菜单事件监听器
  setupUserMenuEventListeners();

  // 如果用户已登录，初始化应用
  if (isAuthenticated) {
    initializeApp();
    return; // 关键优化点：直接返回避免后续认证逻辑
  }

  // 认证标签切换
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      
      authTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      loginForm.classList.remove('active');
      registerForm.classList.remove('active');
      
      if (tabId === 'login') {
        loginForm.classList.add('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
      } else {
        registerForm.classList.add('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
      }
    });
  });
  
  // 登录功能
  loginBtn.addEventListener('click', async () => {
    const email = loginEmail.value;
    const password = loginPassword.value;
    
    if (!email || !password) {
      showRoundedAlert('请输入邮箱和密码', 'warning');
      return;
    }
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    showRoundedAlert('登录成功！', 'success');
    if (error) {
      console.error('登录错误:', error);
      showRoundedAlert(`登录失败: 请检查用户名或密码是否正确！`, 'error');
      return;
    }
    
    user = data.user;
    // 显示用户状态 - 根据邮箱前缀映射到用户名
    const emailPrefix = user.email.split('@')[0]; // 获取邮箱前缀
    const usernameMap = {
      '162004332': '系统管理员',
      'rickyone': '数据管理员',
      '13762405681': '王英',
      'ksf2025': '康师傅',
      'pepsi_cola': '百事可乐',
      'coca_cola': '可口可乐',
      '15096086678': '娟子'
    };
  
    // 如果邮箱前缀在映射表中，则使用映射的用户名，否则使用邮箱前缀
    const displayName = usernameMap[emailPrefix] || emailPrefix;
    userName.textContent = displayName;
    
    userStatus.style.display = 'block';
    authContainer.style.display = 'none';
    appContainer.style.display = 'block';
    
    // 登录成功后初始化应用
    initializeApp();
  });

  // ============== 注册功能 ==============  
  registerBtn.addEventListener('click', async () => {
    const email = registerEmail.value;
    const password = registerPassword.value;
    const phone = registerPhone.value;

    if (!email || !password) {
      showRoundedAlert('请输入邮箱和密码', 'warning');
      return;
    }

    const signUpOptions = {
      email,
      password,
      options: {
        data: {}
      }
    };
    
    if (phone) {
      signUpOptions.phone = phone;
    }
    
    try {
      const { data, error } = await supabaseClient.auth.signUp(signUpOptions);
      
      if (error) {
        showRoundedAlert(`注册失败: 该功能被禁止，请与管理员联系！`, 'error');
        return;
      }
      
      showRoundedAlert('注册成功! 请检查您的邮箱进行验证', 'success');
      
      // 切换到登录表单
      authTabs.forEach(t => t.classList.remove('active'));
      document.querySelector('.auth-tab[data-tab="login"]').classList.add('active');
      loginForm.classList.add('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      
      // 预填充登录表单
      loginEmail.value = email;
    } catch (error) {
      showRoundedAlert(`注册异常: ${error.message}`, 'error');
    }
  });

  // 忘记密码功能
  forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = loginEmail.value;
    
    if (!email) {
      showRoundedAlert('请输入您的邮箱', 'warning'); // 替换alert
      return;
    }
    
    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href // 使用当前页面作为回调
    });
    
    if (error) {
      console.error('密码重置错误:', error);
      showRoundedAlert(`发送重置邮件失败: ${error.message}`, 'error'); // 替换alert
      return;
    }
    
    showRoundedAlert('密码重置邮件已发送，请检查您的邮箱', 'success'); // 替换alert
  });
}); 

// 新增：专门用于设置用户菜单事件监听器的函数
function setupUserMenuEventListeners() {
  // 添加用户菜单切换功能
  if (userInfo) {
    userInfo.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
    });
  }

  // 点击页面其他地方关闭用户菜单
  document.addEventListener('click', (e) => {
    if (userMenu && userMenu.style.display === 'block' && !userInfo.contains(e.target)) {
      userMenu.style.display = 'none';
    }
  });

  // 实现退出登录功能
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) {
          showRoundedAlert('退出登录失败: ' + error.message, 'error');
          return;
        }
        
        user = null;
        userStatus.style.display = 'none';
        appContainer.style.display = 'none';
        authContainer.style.display = 'block';
        
        showRoundedAlert('已成功退出登录', 'success');
      } catch (error) {
        console.error('退出登录错误:', error);
        showRoundedAlert('退出登录时发生错误', 'error');
      }
    });
  }
}


// ============== 修改后的应用初始化函数 ==============
function initializeApp() {

  // 设置默认日期：当月1号到今天
  setDefaultDates();

  // 添加日期变化监听（带防抖）
  let debounceTimer;
  const handleDateChange = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loadFilterOptions()
        .then(() => {
          loadData();// 加载筛选选项后自动加载数据
        })
        .catch(console.error);
    }, 500); // 500ms防抖
  };

  // 绑定日期输入框的变化事件
  startDateEl.addEventListener('change', handleDateChange);
  endDateEl.addEventListener('change', handleDateChange);

  loadFilterOptions().then(() => {
      // 绑定事件
      queryBtn.addEventListener('click', loadData);
      clearBtn.addEventListener('click', clearFilters);
      document.getElementById('toggleDetails').addEventListener('click', toggleDetailSection);
      
      // 加载初始数据
      loadData();
      console.timeEnd('start');
    })
    .catch(error => {
      console.error('初始化失败:', error);
      loadingEl.innerHTML = `
        <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="color: #e53e3e; font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
          <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">初始化失败</p>
          <p>${error.message}</p>
        </div>
      `;
      loadingEl.style.display = 'block';
    });

  // 使用捕获阶段关闭下拉框
  document.addEventListener('click', (e) => {
    // 只有当点击的不是下拉框相关元素时才关闭
    if (
      !warehouseSelector.contains(e.target) &&
      !warehouseOptions.contains(e.target) &&
      !brandSelector.contains(e.target) &&
      !brandOptions.contains(e.target) &&
      !productSelector.contains(e.target) &&
      !productOptions.contains(e.target) &&
      !customerSelector.contains(e.target) && // 新增客户下拉框判断
      !customerOptions.contains(e.target) // 新增客户下拉框判断
    ) {
      closeAllDropdowns();
    }
  },true); // 添加捕获阶段监听器

  // 为所有下拉框添加标签移除事件监听
  document.querySelectorAll('.select-box').forEach(selectBox => {
    selectBox.addEventListener('click', (e) => {
      // 使用closest确保能捕获动态生成的元素
      const removeBtn = e.target.closest('.tag-remove');
      if (!removeBtn) return;

      e.stopPropagation(); 
      e.preventDefault(); 
      
      const tag = removeBtn.closest('.tag');
      const selectorId = selectBox.id;
      const value = tag.dataset.value;

      // 找到对应的复选框并触发取消选择
      if (selectorId === 'warehouseSelector') {
        const checkbox = warehouseOptions.querySelector(`input[value="${value}"]`);
        if (checkbox) {
          checkbox.checked = false;
          const event = new Event('change', { bubbles: true });
          checkbox.dispatchEvent(event);
        }
      } else if (selectorId === 'brandSelector') {
        const checkbox = brandOptions.querySelector(`input[value="${value}"]`);
        if (checkbox) {
          checkbox.checked = false;
          const event = new Event('change', { bubbles: true });
          checkbox.dispatchEvent(event);
        }
      } else if (selectorId === 'productSelector') {
        const checkbox = productOptions.querySelector(`input[value="${value}"]`);
        if (checkbox) {
          checkbox.checked = false;
          const event = new Event('change', { bubbles: true });
          checkbox.dispatchEvent(event);
        }
      } else if (selectorId === 'customerSelector') {
        const checkbox = customerOptions.querySelector(`input[value="${value}"]`);
        if (checkbox) {
          checkbox.checked = false;
          const event = new Event('change', { bubbles: true });
          checkbox.dispatchEvent(event);
        }
      }
    });
  });

  // 滚动时关闭下拉框
  window.addEventListener('scroll', () => {
    closeAllDropdowns();
  });
  
  // 窗口大小变化时重新定位下拉框
  window.addEventListener('resize', () => {
    if (currentOpenDropdown) {
      const selector = currentOpenDropdown.previousElementSibling;
      if (selector) {
        if (selector.id === 'warehouseSelector') warehouseMultiSelect.positionDropdown();
        else if (selector.id === 'brandSelector') brandMultiSelect.positionDropdown();
        else if (selector.id === 'productSelector') productMultiSelect.positionDropdown();
        else if (selector.id === 'customerSelector') customerMultiSelect.positionDropdown();
      }
    }
  });
}