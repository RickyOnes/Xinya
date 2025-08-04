const SUPABASE_URL = 'https://iglmqwpagzjadwauvchh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbG1xd3BhZ3pqYWR3YXV2Y2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODk4NDAsImV4cCI6MjA2NjQ2NTg0MH0.Mtiwp31mJvbLRTotbrb4_DobjjpM4kg9f4-G8oWz85E';

let supabaseClient;
  console.time('start');
try {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  if(supabaseClient) console.log('Supabase客户端初始化成功');
} catch (error) {
  console.error('Supabase初始化失败:', error);
  showRoundedAlert('系统初始化失败，请刷新页面或联系管理员', 'error'); 
}


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
const totalProfitEl = document.getElementById('totalProfit'); 
const switchWarehouseBtn = document.getElementById('switchWarehouseBtn'); 


const warehouseSelector = document.getElementById('warehouseSelector');
const warehouseOptions = document.getElementById('warehouseOptions');
const brandSelector = document.getElementById('brandSelector');
const brandOptions = document.getElementById('brandOptions');
const productSelector = document.getElementById('productSelector');
const productOptions = document.getElementById('productOptions');
const customerSelector = document.getElementById('customerSelector');
const customerOptions = document.getElementById('customerOptions');


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


const userStatus = document.getElementById('userStatus');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const userMenu = document.getElementById('userMenu');
const logoutBtn = document.getElementById('logoutBtn');


let allWarehouses = [];
let allBrands = [];
let allProductsData = [];
let brandMap = {};
let currentOpenDropdown = null;
let selectedProducts = []; 
let user = null; 
let currentWarehouse = 'default'; 
let allSalesPersons = []; 
let allCustomers = []; 
let salesRecords = []; 



function formatNumber(num) {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString('zh-CN', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}


function setDefaultDates() {
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const endDate = new Date();
  const startDate = new Date();
  
  
  if (endDate.getDate() === 1) {
    
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(1);
    
    endDate.setMonth(endDate.getMonth() - 1);
    endDate.setDate(new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate());
  } else {
    
    startDate.setDate(1);
    endDate.setDate(endDate.getDate() - 1);
  }
  
  endDateEl.value = formatDate(endDate);
  startDateEl.value = formatDate(startDate);
}


async function initAuth() {
  if (!supabaseClient) {
    return false;
  }

  try {
    const { data: { user: currentUser }, error } = await supabaseClient.auth.getUser();

    if (currentUser) {
      user = currentUser;
      
      const emailPrefix = currentUser.email.split('@')[0]; 
      const usernameMap = {
        '162004332': '系统管理员',
        'rickyone': '数据管理员',
        '13762405681': '王英',
        'ksf2025': '康师傅',
        'pepsi_cola': '百事可乐',
        'coca_cola': '可口可乐',
        '15096086678': '娟子'
      };
      
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


function showRoundedAlert(message, type = 'error') {
  
  const existingAlert = document.getElementById('custom-alert');
  if (existingAlert) existingAlert.remove();
  
  
  const alertContainer = document.createElement('div');
  alertContainer.id = 'custom-alert';
  alertContainer.className = `rounded-alert ${type}`;
  
  
  alertContainer.innerHTML = `
    <div class="alert-content">
      <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  
  document.body.appendChild(alertContainer);
  
  
  const containerWidth = alertContainer.offsetWidth;
  const leftPosition = (window.innerWidth - containerWidth) / 2;
  
  
  alertContainer.style.top = '20px';
  alertContainer.style.left = `${leftPosition}px`;
  
  
  setTimeout(() => {
    alertContainer.classList.add('fade-out');
    setTimeout(() => alertContainer.remove(), 300);
  }, 2000);
}


function switchWarehouse() {
  
  if (detailSection.classList.contains('visible')) {
    detailSection.classList.remove('visible');
    
    const icon = document.querySelector('#toggleDetails i');
    icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
  }
  
  
  currentWarehouse = currentWarehouse === 'default' ? 'longqiao' : 'default';
  
  
  const filtersRow = document.querySelector('.filters-row');
  
  
  if (currentWarehouse === 'longqiao') {
    filtersRow.classList.add('longqiao');
  } else {
    filtersRow.classList.remove('longqiao');
  }
  
  
  updateUIForWarehouse();  
  
  clearPieChart(); 
  setDefaultDates() 

  
  loadFilterOptions().then(() => {
    
    warehouseMultiSelect.reset();
    brandMultiSelect.reset();
    productMultiSelect.reset();
    if (customerMultiSelect) { 
      customerMultiSelect.reset();
    }    
    updateDetailTableHeader(); 
    loadData();
  });
}


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
  
  const customerFilterGroup = document.getElementById('customerFilterGroup');
  if (customerFilterGroup) {
    customerFilterGroup.style.display = currentWarehouse === 'longqiao' ? 'block' : 'none';
  }  
}


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


class MultiSelect {
  constructor(selector, optionsContainer, placeholder) {
    this.selector = selector;
    this.optionsContainer = optionsContainer;
    this.placeholder = placeholder;
    this.selectedValues = [];
    this.allOptions = [];
    this.clearBtn = selector.querySelector('.clear-btn');
    
    
    this.initEvents();
  }

  initEvents() {
    
    this.selector.addEventListener('click', (e) => this.toggleDropdown(e));
    
    
    this.clearBtn.addEventListener('click', (e) => this.clearSelection(e));
    
    
    this.optionsContainer.addEventListener('change', (e) => this.handleOptionChange(e));
    
    
    this.optionsContainer.addEventListener('mouseenter', () => 
      this.optionsContainer.classList.add('active'));
    this.optionsContainer.addEventListener('mouseleave', () =>  
      this.optionsContainer.classList.remove('active'));
  }

  toggleDropdown(e) { 
    
    if (
      e.target.classList.contains('tag-remove') || 
      e.target.classList.contains('tag') ||
      e.target.closest('.tag-remove') ||
      e.target.closest('.tag')
    ) {
      return; 
    }   

    e.stopPropagation();
    
    
    closeAllDropdowns();
    
    
    const isOpening = !this.optionsContainer.classList.contains('visible');
    
    if (isOpening) {
      this.optionsContainer.classList.add('visible');
      currentOpenDropdown = this.optionsContainer;
      const arrow = this.selector.querySelector('.arrow');
      arrow.classList.replace('fa-chevron-down', 'fa-chevron-up');
      this.positionDropdown();
    }
  }

  positionDropdown() { 
    const rect = this.selector.getBoundingClientRect();
    const parentRect = this.selector.parentElement.getBoundingClientRect();
    
    this.optionsContainer.style.width = `${rect.width}px`;
    this.optionsContainer.style.left = `${rect.left - parentRect.left}px`;
    this.optionsContainer.style.top = `${rect.bottom - parentRect.top}px`;
  }

  clearSelection(e) { 
    e.stopPropagation(); 
    this.selectedValues = [];
    this.updateDisplay();
    
    
    const checkboxes = this.optionsContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    
    
    if (this.selector.id === 'brandSelector') {
      selectedProducts = [];
      filterProductsByBrand();
    } else if (this.selector.id === 'productSelector') {
      selectedProducts = [];
      filterProductsByBrand();
    }
  }

  handleOptionChange(e) { 
    if (!e.target.matches('input[type="checkbox"]')) return; 
    
    const checkbox = e.target;
    const value = checkbox.value;
    
    
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
    
    else {
      if (checkbox.checked) {
        if (!this.selectedValues.includes(value)) {
          this.selectedValues.push(value);
        }
      } else {
        const index = this.selectedValues.indexOf(value);
        if (index > -1) this.selectedValues.splice(index, 1);
      }
      
      
      this.updateSelectAllState();
    }
    
    this.updateDisplay();
    
    
    if (this.selector.id === 'brandSelector') {
      selectedProducts = [];
      filterProductsByBrand();
      if (currentWarehouse === 'longqiao') { 
        filterCustomersByBrand();
      }      
    }

    
    if (this.selector.id === 'warehouseSelector') {
      reloadBrandAndProductOptions();
    }    
  }

  updateDisplay() { 
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
    
    
    const maxDisplay = 5;
    const displayValues = this.selectedValues.slice(0, maxDisplay);
    const remainingCount = this.selectedValues.length - maxDisplay;
    
    displayValues.forEach(value => {
      const option = this.allOptions.find(opt => opt.value === value);
      if (!option) return;

      
      displayEl.insertAdjacentHTML('beforeend', `
        <div class='tag' data-value='${value}'>
          ${option.label}
          <span class='tag-remove'><i class="far fa-circle-xmark"></i></span> 
        </div>
      `);      
    });
    
    
    if (remainingCount > 0) {
      const moreTag = document.createElement('div');
      moreTag.className = 'tag more-tag';
      moreTag.textContent = `...等${this.selectedValues.length}项`;
      displayEl.appendChild(moreTag);
    }
    
    
    arrow.style.display = 'none';
    this.clearBtn.style.display = 'block';
  }

  
  reset() {
    this.selectedValues = [];
    this.updateDisplay();
    
    
    const checkboxes = this.optionsContainer.querySelectorAll(
      'input[type="checkbox"]'
    );
    checkboxes.forEach(checkbox => (checkbox.checked = false));
  }

  
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

  renderOptions() { 
    this.optionsContainer.innerHTML = '';
    
    
    const selectAllOption = document.createElement('div');
    selectAllOption.className = 'option';
    selectAllOption.innerHTML = `
      <input type="checkbox" id="selectAll${this.selector.id}">
      <label for="selectAll${this.selector.id}">全选</label>
    `;
    this.optionsContainer.appendChild(selectAllOption);
    
    
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


let warehouseMultiSelect, brandMultiSelect, productMultiSelect, customerMultiSelect;



function filterProductsByBrand() {
  
  productOptions.innerHTML = '';

  
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

  
  if (displayBrandCount > 0) {
    filteredProducts = allProductsData.filter(p => 
      brandMap[p.product_id] && brandMultiSelect.selectedValues.includes(brandMap[p.product_id])
    );
  } else {
    filteredProducts = allProductsData;
    displayBrandCount = '全部';
  }

  
  productMultiSelect.selectedValues = [];
  
  
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

  
  const placeholderEl = productSelector.querySelector('.placeholder');
  placeholderEl.textContent = brandMultiSelect.selectedValues.length === 0 
    ? '全部商品' 
    : `已筛选${displayBrandCount}个品牌`;
  
  
  productMultiSelect.setOptions(
    filteredProducts.map(p => ({ 
      value: p.product_id, 
      label: p.product_name 
    })).sort((a, b) => a.label.localeCompare(b.label)) 
  );
}


function filterCustomersByBrand() { 
  const selectedBrands = brandMultiSelect.selectedValues;
  const selectedSales = warehouseMultiSelect.selectedValues; 
  
  
  let filteredCustomers = [];
  
  if (selectedBrands.length > 0 || selectedSales.length > 0) {
    filteredCustomers = allCustomers.filter(customer => {
      
      return salesRecords.some(record => 
        record.customer === customer && 
        
        (selectedBrands.length === 0 || selectedBrands.includes(record.brand)) &&
        (selectedSales.length === 0 || selectedSales.includes(record.sales))
      );
    });
  } else {
    
    filteredCustomers = allCustomers;
  }
  
  
  customerMultiSelect.setOptions(
    filteredCustomers.map(c => ({ value: c, label: c }))
      .sort((a, b) => a.label.localeCompare(b.label))
  );
  
  
  if (customerMultiSelect) {
    customerMultiSelect.reset();
  }
}


function reloadBrandAndProductOptions() {
  
  if (!salesRecords || salesRecords.length === 0) {
    return;
  }

  try {
    
    let filteredRecords = [...salesRecords];
    
    
    if (currentWarehouse === 'longqiao') {
      
      if (warehouseMultiSelect.selectedValues.length > 0) {
        filteredRecords = filteredRecords.filter(record => 
          warehouseMultiSelect.selectedValues.includes(record.sales)
        );
      }
    } else {
      
      if (warehouseMultiSelect.selectedValues.length > 0) {
        filteredRecords = filteredRecords.filter(record => 
          warehouseMultiSelect.selectedValues.includes(record.warehouse)
        );
      }
    }

    
    const uniqueProducts = new Map();
    brandMap = {}; 
    
    filteredRecords.forEach(record => {
      
      if (record.product_id) {
        
        if (!uniqueProducts.has(record.product_id)) {
          uniqueProducts.set(record.product_id, {
            product_id: record.product_id,
            product_name: record.product_name || '未知商品'
          });
        }
        
        
        brandMap[record.product_id] = record.brand || '无品牌';
      }
    });
    
    allProductsData = Array.from(uniqueProducts.values());
    allBrands = [...new Set(Object.values(brandMap))].sort();

    
    brandMultiSelect.setOptions(
      allBrands.map(brand => ({ value: brand, label: brand }))
        .sort((a, b) => a.label.localeCompare(b.label)) 
    );
    
    
    filterProductsByBrand();
    
    
    if (currentWarehouse === 'longqiao') {
      
      const uniqueCustomers = [...new Set(filteredRecords
        .map(record => record.customer)
        .filter(c => c) 
      )].sort();
      
      
      customerMultiSelect.setOptions(
        uniqueCustomers.map(customer => ({ 
          value: customer, 
          label: customer 
        })).sort((a, b) => a.label.localeCompare(b.label)) 
      );
      if (customerMultiSelect) {   
        customerMultiSelect.reset();
      } 
      if (brandMultiSelect) {   
        brandMultiSelect.reset();
      }            
    }
    
  } catch (error) {
    console.error('重新加载品牌和商品选项失败:', error);
  }
}



async function fetchRecords(tableName, fields, conditions = {}) {
  if (!supabaseClient) {
    throw new Error('Supabase客户端未初始化');
  }

  try {
    const batchSize = 10000; 
    let allData = []; 
    let from = 0; 
    let hasMore = true; 

    
    let baseQuery = supabaseClient
      .from(tableName)
      .select(fields.join(','));

    
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

    
    while (hasMore) {
      
      let query = baseQuery.range(from, from + batchSize - 1);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      
      if (data && data.length > 0) {
        allData = [...allData, ...data];
      }
      
      
      hasMore = data.length === batchSize;
      from += batchSize;
    }
    return allData;
  } catch (error) {
    console.error(`从 ${tableName} 获取数据失败:`, error);
    throw error;
  }
}


async function loadFilterOptions() {
  if (!supabaseClient) {
    showRoundedAlert('错误: Supabase客户端未初始化', 'error');
    return;
  }

  try {
    
    loadingEl.style.display = 'block';
    showLoadingOverlay(); 
        
    
    const startDate = startDateEl.value;
    const endDate = endDateEl.value ;
    
    
    const table = currentWarehouse === 'longqiao' ? 'longqiao_records' : 'sales_records';
    
    const fields = currentWarehouse === 'longqiao'
      ? ['sale_date', 'product_id', 'product_name', 'sales', 'quantity', 'customer', 'amount', 'cost', 'brand']
      : ['sale_date', 'product_id', 'product_name', 'warehouse', 'quantity', 'unit_price', 'brand', 'pieces'];

    
    const conditions = {
      sale_date: { gte: startDate, lte: endDate }
    };
    console.time('filter-query');
    
    salesRecords = await fetchRecords(table, fields, conditions);
    console.timeEnd('filter-query');
    
    if (salesRecords.length > 0) {
      const warehouseKey = currentWarehouse === 'longqiao' ? 'sales' : 'warehouse';
      allWarehouses = [...new Set(salesRecords.map(record => record[warehouseKey]))]
        .filter(wh => wh) 
        .sort();
    }
    
    
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
        .filter(b => b) 
        .sort();
    }

    
    if (currentWarehouse === 'longqiao' && salesRecords.length > 0) {
      allCustomers = [...new Set(salesRecords.map(record => record.customer))]
        .filter(c => c) 
        .sort();
    }
 
    
    warehouseMultiSelect = new MultiSelect(warehouseSelector, warehouseOptions, 
      currentWarehouse === 'longqiao' ? '销售人员' : '仓库');
    brandMultiSelect = new MultiSelect(brandSelector, brandOptions, '品牌');
    productMultiSelect = new MultiSelect(productSelector, productOptions, '商品');
  
    
    customerMultiSelect = new MultiSelect(customerSelector, customerOptions, '客户');
    customerMultiSelect.setOptions(
      allCustomers.map(c => ({ value: c, label: c }))
        .sort((a, b) => a.label.localeCompare(b.label)) 
    );

    
    warehouseMultiSelect.setOptions(
      allWarehouses.map(wh => ({ value: wh, label: wh }))
        .sort((a, b) => a.label.localeCompare(b.label)) 
    );
    
    brandMultiSelect.setOptions(
      allBrands.map(brand => ({ value: brand, label: brand }))
        .sort((a, b) => a.label.localeCompare(b.label)) 
    );
    
    
    productMultiSelect.setOptions(
      allProductsData.map(p => ({ value: p.product_id, label: p.product_name }))
        .sort((a, b) => a.label.localeCompare(b.label)) 
    );
    
    
    if (currentWarehouse === 'longqiao' && allBrands.length === 1) {
      
      setTimeout(() => {
        loadData();
      }, 0);
    }
    
    return Promise.resolve();
  } catch (error) {
    showRoundedAlert('筛选选项加载失败: ' + error.message, 'error');
    return Promise.reject(error);
  } finally {
    
    loadingEl.style.display = 'none';
    hideLoadingOverlay(); 
  } 
}


function loadData() {
  
  if (detailSection.classList.contains('visible')) {
    detailSection.classList.remove('visible');
    
    const icon = document.querySelector('#toggleDetails i');
    icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
  }

  
  summaryTable.innerHTML = '';
  detailTable.innerHTML = '';
  clearPieChart(); 

  try { 

    
    let data = salesRecords; 
    
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

    calculateSummary(data);
    
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


function renderDetailTable(data, shouldRender = false) {
  
  const detailCountEl = document.getElementById('detailCount');
  
  
  if (!data || data.length === 0) {
    detailCountEl.textContent = '(0条数据)';
  } else {
    detailCountEl.textContent = `(${data.length}条)`;
  }
  
  
  if (!shouldRender) {
    return;
  }
  
  
  setTimeout(() => {
    try {
      console.time('renderDetailTable');
      const tbody = detailTable;
      tbody.innerHTML = '';

      
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
        
        
        row.innerHTML = `
          <td>${record.sale_date || '--'}</td>
          <td>${ 
            currentWarehouse === 'longqiao' 
              ? (record.customer || '--')  
              : (record.product_id || '--') 
          }</td>
          <td>${record.product_name || '--'}</td>
          <td>${record.brand || '--'}</td>
          <td>${warehouseField}</td>
          <td>${formatNumber(record.quantity || 0)}</td>
          <td>${cost}</td>
          <td>¥${formatNumber(amount)}</td>
        `;
        
        
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


function getFilteredData() {
  
  let data = salesRecords;
  
  
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


function showDetailTable() {
  
  if (loadingEl) {
    loadingEl.style.display = 'block';
    showLoadingOverlay(); 
  }

  
  if (detailSection.classList.contains('visible')) {
    
    const data = getFilteredData();
    
    
    renderDetailTable(data, true);
    
    
    setTimeout(() => {
      if (loadingEl) {
        loadingEl.style.display = 'none';
        hideLoadingOverlay(); 
      }
    }, 300);
  } else {
    
    if (loadingEl) {
      loadingEl.style.display = 'none';
      hideLoadingOverlay(); 
    }
  }
}


function calculateSummary(data) {
  const summaryTableEl = document.getElementById('summaryTable');
  let thead = summaryTableEl.querySelector('thead');
  if (!thead) {
    thead = document.createElement('thead');
    summaryTableEl.insertBefore(thead, summaryTableEl.firstChild);
  }

  
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
    
    
    if (currentWarehouse === 'longqiao') {
      totalProfitEl.textContent = '¥0.00';
    }
    
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

  
  let totalQuantity = 0; 
  let totalAmount = 0; 
  let totalProfit = 0; 
  let freeIssueAmount = 0;  
  const uniqueBrands = new Set(); 
  const uniqueProducts = new Set(); 
  const summaryMap = new Map(); 

  
  data.forEach(record => {
    
    if (record.product_id) uniqueProducts.add(record.product_id);
    if (record.brand) uniqueBrands.add(record.brand);

    
    let amount, cost;
    if (currentWarehouse === 'longqiao') {
      amount = record.amount || 0;
      cost = record.cost || 0;
      
      
      if (amount === 0) {
        freeIssueAmount += cost;
      } else { 
        const quantity = record.quantity || 0;
        totalQuantity += quantity;
        totalAmount += amount;
        totalProfit += amount - cost;
      }
    } else { 
      const pieces = record.pieces || 0; 
      const quantity = record.quantity || 0;
      const unitPrice = record.unit_price || 0;
      amount = quantity * unitPrice;
      totalQuantity += pieces; 
      totalAmount += amount;
      cost = unitPrice;
    }

    
    if (currentWarehouse !== 'longqiao' || amount !== 0) {
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
      if (currentWarehouse === 'longqiao') {
        summary.total_quantity += record.quantity || 0;
        summary.total_amount += amount;
        summary.total_cost += cost;
        summary.profit += amount - cost;
      } else {
        summary.total_quantity += record.pieces || 0; 
        summary.total_amount += amount;
      }
    }

    
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
      summary.free_issue += cost;  
    }
  });

  
  const isSingleBrandInLongqiao = currentWarehouse === 'longqiao' && 
    (uniqueBrands.size === 1 || allBrands.length === 1);
  const singleBrandName = uniqueBrands.size === 1 ? 
    Array.from(uniqueBrands)[0] : 
    (allBrands.length === 1 ? allBrands[0] : null);

  
  if (isSingleBrandInLongqiao && singleBrandName) {
    
    const salesSummaryMap = new Map();
    
    
    let salesTotalQuantity = 0;
    let salesTotalAmount = 0;
    let salesTotalProfit = 0;
    let salesFreeIssueAmount = 0;
    const salesUniqueProducts = new Set(); 
    
    data.forEach(record => {
      
      if (record.brand === singleBrandName) {
        
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
            
            summary.free_issue += cost;
            salesFreeIssueAmount += cost;
          } else {
            
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
    
    
    totalQuantityEl.textContent = formatNumber(salesTotalQuantity);
    totalAmountEl.textContent = `¥${formatNumber(salesTotalAmount)}`;
    totalProfitEl.textContent = `¥${formatNumber(salesTotalProfit)}`;
    totalBrandsEl.textContent = `¥${formatNumber(salesFreeIssueAmount)}`;
    totalBrandsEl.style.color = '#e53e3e';
    totalProductsEl.textContent = formatNumber(salesUniqueProducts.size); 
    
    const statLabels = document.querySelectorAll('.stat-card .stat-label');
    statLabels[3].textContent = '费用发放';
    salesTotalProfit <= 0 ? totalProfitEl.style.color = '#e53e3e' : totalProfitEl.style.color = '#4361ee';
    
    
    thead.innerHTML = `<tr><th>销售人员</th><th>总件数</th><th>总金额</th><th>总毛利</th><th>费用发放</th></tr>`;
    
    
    const sortedSummaries = Array.from(salesSummaryMap.values()).sort((a, b) => 
      b.total_amount - a.total_amount
    );
    
    
    tbody.innerHTML = ''; 
    
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
    
    
    if (sortedSummaries.length > 0) {
      renderSalesPieChart(sortedSummaries);
    } else {
      clearPieChart();
    }
  } else {
    
    
    
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
    
    
    const sortedSummaries = Array.from(summaryMap.values()).sort((a, b) => 
      b.total_amount - a.total_amount
    );
    
    
    tbody.innerHTML = ''; 
    
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
    
    
    if (data && data.length > 0) {
      renderBrandPieChart(sortedSummaries);
    } else {
      clearPieChart(); 
    }
  }

  setTimeout(() => {
    syncContainersDimensions();
  }, 0);  
}


function renderSalesPieChart(salesSummaries) {
  const chartContainer = document.getElementById('chartContainer');
  
  
  chartContainer.innerHTML = salesSummaries.length > 0 
    ? '<canvas id="brandChart"></canvas>' 
    : '<div class="no-chart-data">无销售人员数据可展示</div>';
  
  if (salesSummaries.length === 0) return;
  
  const ctx = document.getElementById('brandChart').getContext('2d');
  if (!ctx) {
    return;
  }  
  
  
  const generateColors = (count) => {
    const baseColors = [
      '#4BC0C0', 
      '#f54444ff', 
      '#36A2EB', 
      '#F15BB5',  
      '#FFCE56', 
      '#26cd3cff', 
      '#9966FF', 
      '#FF9F40', 
      '#1982C4', 
      '#6A4C93' 
    ];
    
    
    if (count > baseColors.length) {
      for (let i = baseColors.length; i < count; i++) {
        baseColors.push(`#${Math.floor(Math.random()*16777215).toString(16)}`);
      }
    }
    
    return baseColors.slice(0, count);
  };
  
  
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
        radius: '95%' 
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

  
  chartContainer.chartInstance = chart;
}


function syncContainersDimensions() {
  const tableContainer = document.querySelector('.summary-table-container');
  const chartContainer = document.querySelector('.chart-container');
  
  if (tableContainer && chartContainer) {
    
    const tableHeight = tableContainer.offsetHeight;
    
    
    chartContainer.style.height = `${tableHeight}px`;
    
    
    if (chartContainer.chartInstance) {
      chartContainer.chartInstance.resize();
    }
  }
}


function renderBrandPieChart(brandSummaries) {
  const chartContainer = document.getElementById('chartContainer');
  
  
  chartContainer.innerHTML = brandSummaries.length > 0 
    ? '<canvas id="brandChart"></canvas>' 
    : '<div class="no-chart-data">无品牌数据可展示</div>';
  
  if (brandSummaries.length === 0) return;
  
  const ctx = document.getElementById('brandChart').getContext('2d');
  if (!ctx) {
    return;
  }  
  
  
  const generateColors = (count) => {
    if (currentWarehouse === 'longqiao') {
       baseColors = [
        '#4BC0C0', 
        '#f54444ff', 
        '#36A2EB', 
        '#F15BB5',  
        '#FFCE56', 
        '#26cd3cff', 
        '#9966FF', 
        '#FF9F40', 
        '#1982C4', 
        '#6A4C93' 
      ];      
    }else {
       baseColors = [
        '#26cd3cff', 
        '#FFCE56', 
        '#f54444ff', 
        '#36A2EB', 
        '#F15BB5',  
        '#9966FF', 
        '#FF9F40', 
        '#6A4C93', 
        '#4BC0C0', 
        '#1982C4' 
      ];
    }
    
    if (count > baseColors.length) {
      for (let i = baseColors.length; i < count; i++) {
        baseColors.push(`#${Math.floor(Math.random()*16777215).toString(16)}`);
      }
    }
    
    return baseColors.slice(0, count);
  };
  
  
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
        radius: '95%' 
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

  
  chartContainer.chartInstance = chart;
}




function clearPieChart() {
  const chartContainer = document.getElementById('chartContainer');
  chartContainer.innerHTML = '<div class="no-chart-data">无品牌数据可展示</div>';
  
  
  if (chartContainer.chartInstance) {
    chartContainer.chartInstance.destroy();
    chartContainer.chartInstance = null;
  }
}


function clearFilters() {
  
  warehouseMultiSelect.reset();
  brandMultiSelect.reset();
  productMultiSelect.reset();
  if (customerMultiSelect) { 
    customerMultiSelect.reset();
  }
  
  
  filterProductsByBrand();

  
  clearPieChart();  
  
  
  setDefaultDates();
  
  loadFilterOptions().then(() => {
      loadData();
    })
}


function toggleDetailSection() {
  detailSection.classList.toggle('visible');
  
  
  const icon = document.querySelector('#toggleDetails i');
  if (detailSection.classList.contains('visible')) {
    icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
    
    showDetailTable();
  } else {
    icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    
    if (detailTable) {
      detailTable.innerHTML = '';
    }
  }
}


function showLoadingOverlay() {
  
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


function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}


function exportToExcel() {
  try {
    
    const data = getFilteredData();
    
    if (!data || data.length === 0) {
      showRoundedAlert('没有数据可导出', 'warning');
      return;
    }
    
    
    const wb = XLSX.utils.book_new();
    
    
    const exportData = data.map(record => {
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
      
      
      const row = {
        '日期': record.sale_date || '--',
      };
      
      
      if (currentWarehouse === 'longqiao') {
        row['客户名称'] = record.customer || '--';
      } else {
        row['商品ID'] = record.product_id || '--';
      }
      
      row['商品名称'] = record.product_name || '--';
      row['品牌'] = record.brand || '--';
      
      if (currentWarehouse === 'longqiao') {
        row['销售人员'] = warehouseField;
      } else {
        row['仓库'] = warehouseField;
      }
      
      row['销量'] = record.quantity || 0;
      
      if (currentWarehouse === 'longqiao') {
        row['成本'] = cost;
      } else {
        row['单价'] = cost;
      }
      
      row['金额'] = amount;
      
      
      if (currentWarehouse === 'longqiao') {
        const profit = (record.amount || 0) - (record.cost || 0);
        row['毛利'] = profit;
      }
      
      return row;
    });
    
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    
    XLSX.utils.book_append_sheet(wb, ws, "销售记录");
    
    
    const startDate = startDateEl.value;
    const endDate = endDateEl.value;
    const warehouseName = currentWarehouse === 'longqiao' ? '隆桥仓库' : '多多买菜';
    const fileName = `${warehouseName}_销售记录_${startDate}_${endDate}.xlsx`;
    
    
    XLSX.writeFile(wb, fileName);
    
    showRoundedAlert('数据导出成功', 'success');
  } catch (error) {
    console.error('导出失败:', error);
    showRoundedAlert('导出失败: ' + error.message, 'error');
  }
}


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
  
  
  const isAuthenticated = await initAuth();
  
  document.getElementById('switchWarehouseBtn').addEventListener('click', switchWarehouse);
  
  
  setupUserMenuEventListeners();

  
  if (isAuthenticated) {
    initializeApp();
    return; 
  }

  
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
    
    const emailPrefix = user.email.split('@')[0]; 
    const usernameMap = {
      '162004332': '系统管理员',
      'rickyone': '数据管理员',
      '13762405681': '王英',
      'ksf2025': '康师傅',
      'pepsi_cola': '百事可乐',
      'coca_cola': '可口可乐',
      '15096086678': '娟子'
    };
  
    
    const displayName = usernameMap[emailPrefix] || emailPrefix;
    userName.textContent = displayName;
    
    userStatus.style.display = 'block';
    authContainer.style.display = 'none';
    appContainer.style.display = 'block';
    
    
    initializeApp();
  });

  
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
      
      
      authTabs.forEach(t => t.classList.remove('active'));
      document.querySelector('.auth-tab[data-tab="login"]').classList.add('active');
      loginForm.classList.add('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      
      
      loginEmail.value = email;
    } catch (error) {
      showRoundedAlert(`注册异常: ${error.message}`, 'error');
    }
  });

  
  forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = loginEmail.value;
    
    if (!email) {
      showRoundedAlert('请输入您的邮箱', 'warning'); 
      return;
    }
    
    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href 
    });
    
    if (error) {
      console.error('密码重置错误:', error);
      showRoundedAlert(`发送重置邮件失败: ${error.message}`, 'error'); 
      return;
    }
    
    showRoundedAlert('密码重置邮件已发送，请检查您的邮箱', 'success'); 
  });
}); 


function setupUserMenuEventListeners() {
  
  if (userInfo) {
    userInfo.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
    });
  }

  
  document.addEventListener('click', (e) => {
    if (userMenu && userMenu.style.display === 'block' && !userInfo.contains(e.target)) {
      userMenu.style.display = 'none';
    }
  });

  
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



function initializeApp() {

  
  setDefaultDates();

  
  let debounceTimer;
  const handleDateChange = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loadFilterOptions()
        .then(() => {
          loadData();
        })
        .catch(console.error);
    }, 500); 
  };

  
  startDateEl.addEventListener('change', handleDateChange);
  endDateEl.addEventListener('change', handleDateChange);

  loadFilterOptions().then(() => {
      
      queryBtn.addEventListener('click', loadData);
      clearBtn.addEventListener('click', clearFilters);
      document.getElementById('toggleDetails').addEventListener('click', toggleDetailSection);
      document.getElementById('exportDetails').addEventListener('click', exportToExcel);
      
      
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

  
  document.addEventListener('click', (e) => {
    
    if (
      !warehouseSelector.contains(e.target) &&
      !warehouseOptions.contains(e.target) &&
      !brandSelector.contains(e.target) &&
      !brandOptions.contains(e.target) &&
      !productSelector.contains(e.target) &&
      !productOptions.contains(e.target) &&
      !customerSelector.contains(e.target) && 
      !customerOptions.contains(e.target) 
    ) {
      closeAllDropdowns();
    }
  },true); 

  
  document.querySelectorAll('.select-box').forEach(selectBox => {
    selectBox.addEventListener('click', (e) => {
      
      const removeBtn = e.target.closest('.tag-remove');
      if (!removeBtn) return;

      e.stopPropagation(); 
      e.preventDefault(); 
      
      const tag = removeBtn.closest('.tag');
      const selectorId = selectBox.id;
      const value = tag.dataset.value;

      
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

  
  window.addEventListener('scroll', () => {
    closeAllDropdowns();
  });
  
  
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