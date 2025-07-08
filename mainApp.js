// ============== 1. 初始化部分 ==============
// Supabase客户端初始化
const SUPABASE_URL = 'https://iglmqwpagzjadwauvchh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbG1xd3BhZ3pqYWR3YXV2Y2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODk4NDAsImV4cCI6MjA2NjQ2NTg0MH0.Mtiwp31mJvbLRTotbrb4_DobjjpM4kg9f4-G8oWz85E';

let supabaseClient;

try {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('Supabase客户端初始化成功');
} catch (error) {
  console.error('Supabase初始化失败:', error);
  alert('系统初始化失败，请刷新页面或联系管理员');
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

// 多选下拉框元素
const warehouseSelector = document.getElementById('warehouseSelector');
const warehouseOptions = document.getElementById('warehouseOptions');
const brandSelector = document.getElementById('brandSelector');
const brandOptions = document.getElementById('brandOptions');
const productSelector = document.getElementById('productSelector');
const productOptions = document.getElementById('productOptions');

// ============== 3. 全局状态 ==============
let allWarehouses = [];
let allBrands = [];
let allProductsData = [];
let brandMap = {};
let currentOpenDropdown = null;
let selectedProducts = []; // 添加这一行

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
  startDate.setDate(endDate.getDate() - 2);
  
  endDateEl.value = formatDate(endDate);
  startDateEl.value = formatDate(startDate);
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
    
    // 显示前3个选中项
    const maxDisplay = 3;
    const displayValues = this.selectedValues.slice(0, maxDisplay);
    const remainingCount = this.selectedValues.length - maxDisplay;
    
    displayValues.forEach(value => {
      const option = this.allOptions.find(opt => opt.value === value);
      if (!option) return;
      
/*       const tag = document.createElement('div');
      tag.className = 'tag';
      tag.dataset.value = value;
      tag.innerHTML = `
        ${option.label}
        <span class='tag-remove'>×</span>
      `;
      displayEl.appendChild(tag); */

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

  // 新增：取消选择特定值
  deselect(value) {
    this.selectedValues = this.selectedValues.filter(v => v !== value);
    this.updateDisplay();
    
    // 更新对应复选框状态
    const checkbox = this.optionsContainer.querySelector(
      `input[value="${value}"]`
    );
    if (checkbox) checkbox.checked = false;
    
    // 更新全选状态
    this.updateSelectAllState();
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
let warehouseMultiSelect, brandMultiSelect, productMultiSelect;

// ============== 6. 品牌与商品过滤 ==============
// 根据品牌过滤商品选项
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
    }))
  );
}

// ============== 7. 数据加载与处理 ==============
// 加载筛选选项
async function loadFilterOptions() {
  if (!supabaseClient) {
    console.error('错误: Supabase客户端未初始化');
    return;
  }
  
  try {
    // 智能分批查询函数 - 解决Supabase默认1000行限制问题
    async function fetchAllRecords() {
      let allRecords = [];
      let batchSize = 1000; // 保持默认限制
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabaseClient
          .from('sales_records')
          .select('warehouse, product_id, product_name, brand')
          .not('warehouse', 'is', null)
          .not('product_id', 'is', null)
          .range(from, from + batchSize - 1); // 使用范围查询分批获取

        if (error) throw error;
        
        allRecords = [...allRecords, ...data];
        from += batchSize;
        
        // 检测是否还有更多数据
        hasMore = data.length === batchSize;
      }

      return allRecords;
    }

    // 获取完整销售记录
    const salesRecords = await fetchAllRecords();
    console.log(`获取完整销售记录: ${salesRecords.length}条`);
    
    // 处理仓库数据
    allWarehouses = [...new Set(salesRecords.map(record => record.warehouse))].sort();
    
    // 处理商品和品牌数据
    const uniqueProducts = new Map();
    brandMap = {};
    
    salesRecords.forEach(record => {
      if (!uniqueProducts.has(record.product_id)) {
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
    allBrands = [...new Set(salesRecords.map(record => record.brand))].filter(b => b).sort();
    
    // 初始化多选下拉框实例
    warehouseMultiSelect = new MultiSelect(warehouseSelector, warehouseOptions, '仓库');
    brandMultiSelect = new MultiSelect(brandSelector, brandOptions, '品牌');
    productMultiSelect = new MultiSelect(productSelector, productOptions, '商品');

    // 设置下拉框选项
    warehouseMultiSelect.setOptions(
      allWarehouses.map(wh => ({ value: wh, label: wh }))
    );
    
    brandMultiSelect.setOptions(
      allBrands.map(brand => ({ value: brand, label: brand }))
    );
    
    // 修复点：初始商品选项使用完整列表
    productMultiSelect.setOptions(
      allProductsData.map(p => ({ value: p.product_id, label: p.product_name }))
    );
    
    return Promise.resolve();
  } catch (error) {
    console.error('加载筛选选项失败:', error);
    alert('筛选选项加载失败: ' + error.message);
    return Promise.reject(error);
  }
}

// 加载数据
async function loadData() {
  if (!supabaseClient) {
    alert('系统未初始化，请刷新页面');
    return;
  }

  // 显示悬浮加载动画
  loadingEl.style.display = 'block';

  // 清除表格内容
  summaryTable.innerHTML = '';
  detailTable.innerHTML = '';

  const startDate = startDateEl.value;
  const endDate = endDateEl.value;

  try {
    let query = supabaseClient
      .from('sales_records')
      .select('sale_date, product_id, product_name, warehouse, quantity, unit_price, brand')
      .gte('sale_date', startDate)
      .lte('sale_date', endDate);

    if (warehouseMultiSelect.selectedValues.length > 0) {
      query = query.in('warehouse', warehouseMultiSelect.selectedValues);
    }

    if (brandMultiSelect.selectedValues.length > 0) {
      query = query.in('brand', brandMultiSelect.selectedValues);
    }

    if (productMultiSelect.selectedValues.length > 0) {
      query = query.in('product_id', productMultiSelect.selectedValues);
    }

    const { data, error } = await query;

    if (error) throw error;

    renderDetailTable(data);
    calculateSummary(data);

  } catch (error) {
    console.error('查询错误详情:', error);
    // 显示错误信息
    loadingEl.innerHTML = `
      <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="color: #e53e3e; font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">数据加载失败</p>
        <p>${error.message}</p>
      </div>
    `;
  } finally {
    // 隐藏加载动画
    loadingEl.style.display = 'none';
  }
}

// 渲染详细表格
function renderDetailTable(data) {
  const tbody = detailTable;
  tbody.innerHTML = '';
  
  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 30px; color: #6c757d;">
          <i class="fas fa-database" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
          未找到匹配的记录
        </td>
      </tr>
    `;
    return;
  }
  
  data.forEach(record => {
    const row = document.createElement('tr');
    const amount = (record.quantity || 0) * (record.unit_price || 0);
    
    row.innerHTML = `
      <td>${record.sale_date || '--'}</td>
      <td>${record.product_id || '--'}</td>
      <td>${record.product_name || '--'}</td>
      <td>${record.brand || '--'}</td>
      <td>${record.warehouse || '--'}</td>
      <td>${formatNumber(record.quantity || 0)}</td>
      <td>¥${formatNumber(record.unit_price || 0)}</td>
      <td>¥${formatNumber(amount)}</td>
    `;
    tbody.appendChild(row);
  });
}

// 计算汇总数据
function calculateSummary(data) {
  if (!data || data.length === 0) {
    totalQuantityEl.textContent = '0';
    totalAmountEl.textContent = '¥0.00';
    totalProductsEl.textContent = '0';
    totalBrandsEl.textContent = '0';
    summaryTable.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 30px; color: #6c757d;">
          <i class="fas fa-chart-bar" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
          无汇总数据
        </td>
      </tr>
    `;
    return;
  }

  // 计算总销量和总金额
  let totalQuantity = 0;
  let totalAmount = 0;
  
  data.forEach(record => {
    totalQuantity += record.quantity || 0;
    totalAmount += (record.quantity || 0) * (record.unit_price || 0);
  });

  // 计算品牌数量和商品种类
  const uniqueBrands = new Set();
  const uniqueProducts = new Set();
  
  data.forEach(record => {
    uniqueBrands.add(record.brand);
    uniqueProducts.add(record.product_id);
  });

  // 更新统计卡片
  totalQuantityEl.textContent = formatNumber(totalQuantity);
  totalAmountEl.textContent = `¥${formatNumber(totalAmount)}`;
  totalBrandsEl.textContent = formatNumber(uniqueBrands.size);
  totalProductsEl.textContent = formatNumber(uniqueProducts.size);
  
  // 按日期和品牌汇总
  const summaryMap = new Map();
  
  data.forEach(record => {
    const brand = record.brand || '未知品牌'; // 处理空品牌情况
    
    if (!summaryMap.has(brand)) {
      summaryMap.set(brand, {
        brand: brand,
        total_quantity: 0,
        total_amount: 0
      });
    }
    
    const summary = summaryMap.get(brand);
    summary.total_quantity += (record.quantity || 0);
    summary.total_amount += (record.quantity || 0) * (record.unit_price || 0);
  });
  
  // 按品牌名称排序
  const sortedSummaries = Array.from(summaryMap.values()).sort((a, b) => 
    a.brand.localeCompare(b.brand)
  );
  
  // === 修改点2: 渲染汇总表格（只显示品牌）===
  summaryTable.innerHTML = '';
  
  sortedSummaries.forEach(summary => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${summary.brand}</td>
      <td>${formatNumber(summary.total_quantity)}</td>
      <td>¥${formatNumber(summary.total_amount)}</td>
    `;
    summaryTable.appendChild(row);
  });
  
  // === 新增: 渲染饼图 ===
  renderBrandPieChart(sortedSummaries);

  setTimeout(() => {
    syncContainersDimensions();
  }, 0);  
}

// 同步容器尺寸函数
function syncContainersDimensions() {
  const tableContainer = document.querySelector('.summary-table-container');
  const chartContainer = document.querySelector('.chart-container');
  
  if (tableContainer && chartContainer) {
    // 获取左侧表格的实际高度
    const tableHeight = tableContainer.scrollHeight;
    
    // 设置右侧图表容器高度
    chartContainer.style.height = `${tableHeight}px`;
    
    // 如果图表已渲染，重新调整大小
    if (chartContainer.chartInstance) {
      chartContainer.chartInstance.resize();
    }
  }
}

// ============== 新增: 饼图渲染函数 ==============
function renderBrandPieChart(brandSummaries) {
  const chartContainer = document.getElementById('chartContainer');
  
  // 清空容器
  chartContainer.innerHTML = brandSummaries.length > 0 
    ? '<canvas id="brandChart"></canvas>' 
    : '<div class="no-chart-data">无品牌数据可展示</div>';
  
  if (brandSummaries.length === 0) return;
  
  const ctx = document.getElementById('brandChart').getContext('2d');
  if (!ctx) {
    console.error('Canvas context not found');
    return;
  }  
  
  // 改进的颜色生成器 - 增加对比度
  const generateColors = (count) => {
    const baseColors = [
      '#36A2EB', // 蓝色
      '#F15BB5',  // 粉红
      '#FFCE56', // 黄色
      '#FF6384', // 红色
      '#9966FF', // 紫色
      '#FF9F40', // 橙色
      '#8AC926', // 绿色
      '#6A4C93', // 深紫
      '#4BC0C0', // 青色
      '#1982C4' // 深蓝
    ];
    
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
        borderWidth: 2,
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
          color: '#fff',
          font: {
            weight: 'bold',
            size: 12
          },
          align: 'start',
          anchor: 'end',
          offset: 30,
          clip: false,
          textAlign: 'center'
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
// 清除筛选按扭函数
function clearFilters() {
  startDateEl.value = '';
  endDateEl.value = '';
  
  // 使用reset方法重置选择状态（避免重新初始化）
  warehouseMultiSelect.reset();
  brandMultiSelect.reset();
  productMultiSelect.reset();
  
  // 重置商品列表
  filterProductsByBrand();
  
  // 重新设置默认日期
  setDefaultDates();
  
  // 直接加载数据（移除loadFilterOptions调用）
  loadData();
}

// 切换详细记录显示
function toggleDetailSection() {
  detailSection.classList.toggle('visible');
  
  // 更新图标方向
  const icon = document.querySelector('#toggleDetails i');
  if (detailSection.classList.contains('visible')) {
    icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
  } else {
    icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
  }
}

// ============== 9. 页面初始化 ==============
document.addEventListener('DOMContentLoaded', () => {
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
  
  console.log('DOM已加载，开始初始化页面');
  
  // 设置默认日期
  loadFilterOptions()
    .then(() => {
      setDefaultDates();
      
      // 绑定事件
      queryBtn.addEventListener('click', loadData);
      clearBtn.addEventListener('click', clearFilters);
      document.getElementById('toggleDetails').addEventListener('click', toggleDetailSection);
      
      // 加载初始数据
      loadData();
    })
    .catch(error => {
      console.error('初始化失败:', error);
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
      !productOptions.contains(e.target)
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

      e.stopPropagation(); // 阻止事件冒泡
      e.preventDefault(); // 阻止默认行为
      
      const tag = removeBtn.closest('.tag');
      const selectorId = selectBox.id;

      // 根据所在的下拉框类型处理
      if (selectorId === 'warehouseSelector') {
        warehouseMultiSelect.deselect(tag.dataset.value);
      } else if (selectorId === 'brandSelector') {
        brandMultiSelect.deselect(tag.dataset.value);
        filterProductsByBrand();
      } else if (selectorId === 'productSelector') {
        productMultiSelect.deselect(tag.dataset.value);
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
      }
    }
  });
});