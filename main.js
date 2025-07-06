
// 1. 初始化Supabase客户端
const SUPABASE_URL = 'https://iglmqwpagzjadwauvchh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbG1xd3BhZ3pqYWR3YXV2Y2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODk4NDAsImV4cCI6MjA2NjQ2NTg0MH0.Mtiwp31mJvbLRTotbrb4_DobjjpM4kg9f4-G8oWz85E';

let supabaseClient;
let user = null; // 添加认证相关变量
// 存储选中的值
let selectedWarehouses = [];
let selectedBrands = [];
let selectedProducts = [];

// 存储选项数据
let allWarehouses = [];
let allBrands = [];
let allProductsData = [];
let brandMap = {}; // 新增全局变量存储品牌映射

let currentOpenDropdown = null; // 存储当前打开的下拉框
// DOM元素引用
let startDateEl, endDateEl, queryBtn, clearBtn, summaryTable, detailTable, loadingEl;
let totalQuantityEl, totalAmountEl, totalProductsEl, totalBrandsEl, toggleDetails, detailSection;
let warehouseSelector, warehouseOptions, brandSelector, brandOptions, productSelector, productOptions;

// 认证相关DOM元素
let authContainer, appContainer, loginForm, registerForm;
let loginEmail, loginPassword, registerEmail, registerPassword, registerPhone;
let loginBtn, registerBtn, forgotPasswordLink, authTabs;

try {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('Supabase客户端初始化成功');
} catch (error) {
  console.error('Supabase初始化失败:', error);
  alert('系统初始化失败，请刷新页面或联系管理员');
}

// 应用初始化函数
function initializeApp() {
  // 获取DOM元素引用
  startDateEl = document.getElementById('startDate');
  endDateEl = document.getElementById('endDate');
  queryBtn = document.getElementById('queryBtn');
  clearBtn = document.getElementById('clearBtn');
  summaryTable = document.getElementById('summaryTable').querySelector('tbody');
  detailTable = document.getElementById('detailTable').querySelector('tbody');
  loadingEl = document.getElementById('loading');
  totalQuantityEl = document.getElementById('totalQuantity');
  totalAmountEl = document.getElementById('totalAmount');
  totalProductsEl = document.getElementById('totalProducts');
  totalBrandsEl = document.getElementById('totalBrands');
  toggleDetails = document.getElementById('toggleDetails');
  detailSection = document.getElementById('detailSection');

  // 多选下拉框元素
  warehouseSelector = document.getElementById('warehouseSelector');
  warehouseOptions = document.getElementById('warehouseOptions');
  brandSelector = document.getElementById('brandSelector');
  brandOptions = document.getElementById('brandOptions');
  productSelector = document.getElementById('productSelector');
  productOptions = document.getElementById('productOptions');

  // 初始化操作
  setDefaultDates();
  loadFilterOptions();
  
  // 事件监听
  queryBtn.addEventListener('click', loadData);
  clearBtn.addEventListener('click', clearFilters);
  toggleDetails.addEventListener('click', toggleDetailSection);
  
  // 初始数据加载
  setTimeout(() => {
    try {
      loadData();
    } catch (e) {
      console.error('初始数据加载失败:', e);
      loadingEl.innerHTML = '<p style="color: #e53e3e; padding: 1rem;">初始数据加载失败: ' + e.message + '</p>';
    }
  }, 1000);
}

// 数字格式化函数
function formatNumber(num) {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString('zh-CN', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

// 日期格式化功能函数
function setDefaultDates() {
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 2); // 默认显示最近7天
  
  endDateEl.value = formatDate(endDate);
  startDateEl.value = formatDate(startDate);
}

// 下拉框显示优化
function updateMultiselectDisplay(selector, selectedValues, allOptions, placeholder) {
  const placeholderElement = selector.querySelector('.placeholder');
  const displayElement = selector.querySelector('.selected-display');
  const arrow = selector.querySelector('.arrow');
  const clearBtn = selector.querySelector('.clear-btn');
  
  displayElement.innerHTML = '';
  
  if (selectedValues.length === 0) {
    placeholderElement.textContent = '全部' + placeholder.replace('选择', '');
    placeholderElement.style.display = 'block';
    displayElement.style.display = 'none';
    arrow.style.display = 'block';
    arrow.classList.remove('fa-times');
    arrow.classList.add('fa-chevron-down');
    clearBtn.style.display = 'none';
    return;
  }
  
  placeholderElement.style.display = 'none';
  displayElement.style.display = 'flex';
  
  // 最多显示前3个选中项
  const maxDisplay = 3;
  const displayValues = selectedValues.slice(0, maxDisplay);
  const remainingCount = selectedValues.length - maxDisplay;
  
  displayValues.forEach(value => {
    const option = allOptions.find(opt => opt.value === value);
    if (option) {
      const tag = document.createElement('div');
      tag.className = 'tag';
      tag.textContent = option.label;
      
      // 添加移除按钮
      const removeBtn = document.createElement('span');
      removeBtn.className = 'tag-remove';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // 从选择数组中移除
        const index = selectedValues.indexOf(value);
        if (index > -1) {
/*           // +++ 新增：同步更新全局 selectedProducts +++
          if (selector.id === 'productSelector') {
            const globalIndex = selectedProducts.indexOf(value);
            if (globalIndex > -1) {
              selectedProducts.splice(globalIndex, 1);
            }
          } */
          selectedValues.splice(index, 1); // 保留原有逻辑
          
          // 同步更新复选框状态
          const optionsContainer = selector.nextElementSibling;
          const checkbox = optionsContainer.querySelector(`input[value="${value}"]`);
          if (checkbox) {
            checkbox.checked = false;
          }
        }
        
        // 更新UI- 简化逻辑
        updateMultiselectDisplay(selector, selectedValues, placeholder);

        // +++ 如果是品牌下拉框，则更新商品列表 +++
        if (selector.id === 'brandSelector') {
          selectedProducts = [...selectedValues]; // 创建新数组避免引用问题
        }       
        
        // +++ 新增：如果是商品下拉框，需要更新全选状态 +++
        if (selector.id === 'productSelector') {
          const optionsContainer = selector.nextElementSibling;
          const selectAllCheckbox = optionsContainer.querySelector('input[id^="selectAll"]');
          if (selectAllCheckbox) {
            const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]:not([id^="selectAll"])');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
          }

          // +++ 确保全局数组完全同步 +++
          selectedProducts = [...selectedValues];

          // 延迟触发查询更新
          loadData();
        }        
      });
      
      tag.appendChild(removeBtn);
      displayElement.appendChild(tag);
    }
  });
  
  // 显示剩余项提示
  if (remainingCount > 0) {
    const moreTag = document.createElement('div');
    moreTag.className = 'tag more-tag';
    moreTag.textContent = `...等${selectedValues.length}项`;
    displayElement.appendChild(moreTag);
  }
  
  // 根据选中状态切换图标
  arrow.style.display = 'none';
  clearBtn.style.display = selectedValues.length > 0 ? 'block' : 'none';
}

// 添加清除功能处理
function setupClearButton(selector, selectedValues, allOptions, placeholder) {
  const clearBtn = selector.querySelector('.clear-btn');
  
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // 完全清空选择数组
    selectedValues.length = 0;
    
    // 取消所有复选框
    const optionsContainer = selector.nextElementSibling;
    const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // 重置UI显示
    const placeholderElement = selector.querySelector('.placeholder');
    const displayElement = selector.querySelector('.selected-display');
    
    placeholderElement.textContent = '全部' + placeholder.replace('选择', '');
    placeholderElement.style.display = 'block';
    displayElement.innerHTML = '';
    displayElement.style.display = 'none';
    
    // 重置图标
    const arrow = selector.querySelector('.arrow');
    arrow.style.display = 'block';
    arrow.classList.remove('fa-times');
    arrow.classList.add('fa-chevron-down');
    clearBtn.style.display = 'none';
    
    // 如果是品牌下拉框，则更新商品列表
    if (selector.id === 'brandSelector') {
      selectedProducts = []; // 同时清除商品选择
      filterProductsByBrand();
    }

    // +++ 新增：如果是商品下拉框，需要更新显示 +++
    if (selector.id === 'productSelector') {
      // 确保selectedProducts数组被清空
      selectedProducts = [];

      // 重新生成商品列表以确保状态完全重置
      filterProductsByBrand();  
      loadData(); 
    }    
  });
}

function positionDropdown(selector, optionsContainer) {
  const rect = selector.getBoundingClientRect();
  const parentRect = selector.parentElement.getBoundingClientRect();
  
  optionsContainer.style.width = rect.width + 'px';
  optionsContainer.style.left = (rect.left - parentRect.left) + 'px';
  optionsContainer.style.top = (rect.bottom - parentRect.top) + 'px';
}

// 关闭所有下拉框
function closeAllDropdowns() {
  document.querySelectorAll('.options-container').forEach(dropdown => {
    if (dropdown !== currentOpenDropdown) {
      dropdown.classList.remove('visible');
      const prevArrow = dropdown.previousElementSibling.querySelector('.arrow');
      if (prevArrow) {
        prevArrow.classList.remove('fa-chevron-up');
        prevArrow.classList.add('fa-chevron-down');
      }
    }
  });
  currentOpenDropdown = null;
}

// 多选下拉框事件处理
function setupMultiselect(selector, optionsContainer, selectAllCheckbox, selectedValues, allOptions, placeholder) {
  // 初始化清除按钮
  setupClearButton(selector, selectedValues, allOptions, placeholder);
  
  // 点击选择框显示/隐藏选项
  selector.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // 关闭其他下拉框
    if (currentOpenDropdown && currentOpenDropdown !== optionsContainer) {
      currentOpenDropdown.classList.remove('visible');
      const prevArrow = currentOpenDropdown.previousElementSibling.querySelector('.arrow');
      prevArrow.classList.remove('fa-chevron-up');
      prevArrow.classList.add('fa-chevron-down');
    }
    
    // 切换当前下拉框
    const isOpening = !optionsContainer.classList.contains('visible');
    closeAllDropdowns();
    
    if (isOpening) {
      optionsContainer.classList.add('visible');
      currentOpenDropdown = optionsContainer;
      const arrow = selector.querySelector('.arrow');
      arrow.classList.remove('fa-chevron-down');
      arrow.classList.add('fa-chevron-up');
      // 定位下拉框
      positionDropdown(selector, optionsContainer);
    }
  });
  
  // 鼠标进入下拉框保持打开状态
  optionsContainer.addEventListener('mouseenter', () => {
    if (optionsContainer.classList.contains('visible')) {
      optionsContainer.classList.add('active');
    }
  });
  
  // 鼠标离开下拉框
  optionsContainer.addEventListener('mouseleave', () => {
    optionsContainer.classList.remove('active');
  });
  
  // 全选处理
  selectAllCheckbox.addEventListener('change', () => {
    const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]:not([id^="selectAll"])');
    
    if (selectAllCheckbox.checked) {
      selectedValues.length = 0; // 清空当前选择
      checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        if (!selectedValues.includes(checkbox.value)) {
          selectedValues.push(checkbox.value);
        }
      });
    } else {
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
      });
      selectedValues.length = 0;
    }
    
    updateMultiselectDisplay(selector, selectedValues, allOptions, placeholder);
  });
  
  // 选项点击处理
  optionsContainer.addEventListener('change', (e) => {
    if (e.target.tagName === 'INPUT' && !e.target.id.startsWith('selectAll')) {
      const checkbox = e.target;
      
      if (checkbox.checked) {
        if (!selectedValues.includes(checkbox.value)) {
          selectedValues.push(checkbox.value);
        }
      } else {
        const index = selectedValues.indexOf(checkbox.value);
        if (index > -1) {
          selectedValues.splice(index, 1);
        }
      }
      
      // 更新全选状态
      const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]:not([id^="selectAll"])');
      const allChecked = Array.from(checkboxes).every(cb => cb.checked);
      selectAllCheckbox.checked = allChecked;
      
      updateMultiselectDisplay(selector, selectedValues, allOptions, placeholder);
      
      // 如果是品牌下拉框，则过滤商品
      if (optionsContainer.id === 'brandOptions') {
        filterProductsByBrand();
      }

      // 确保选择选项时下拉框保持打开状态
      if (currentOpenDropdown === optionsContainer) {
        optionsContainer.classList.add('visible');
      }
    }
  });

  // 点击页面其他地方关闭所有下拉框
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
  });

  // 滚动时关闭下拉框
  window.addEventListener('scroll', () => {
    closeAllDropdowns();
  });
}

// 修改品牌选择变化事件处理
brandSelector.addEventListener('change', () => {
  // 当品牌选择变化时，清除已选商品
  selectedProducts = [];

  // 重置商品下拉框的UI状态
  const placeholder = productSelector.querySelector('.placeholder');
  placeholder.textContent = '全部商品';
  placeholder.style.display = 'block';
  
  const displayElement = productSelector.querySelector('.selected-display');
  displayElement.innerHTML = '';
  displayElement.style.display = 'none';

  // 根据新选择的品牌过滤商品
  filterProductsByBrand();   
  loadData();   
});

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
    brandMap = {}; // 重置品牌映射
    
    salesRecords.forEach(record => {
      // 处理商品信息
      if (!uniqueProducts.has(record.product_id)) {
        uniqueProducts.set(record.product_id, {
          product_id: record.product_id,
          product_name: record.product_name
        });
      }
      
      // 构建品牌映射
      if (record.product_id && record.brand) {
        brandMap[record.product_id] = record.brand;
      }
    });
    
    allProductsData = Array.from(uniqueProducts.values());
    allBrands = [...new Set(salesRecords.map(record => record.brand))].filter(b => b).sort();
    
    // 添加到仓库多选框
    warehouseOptions.innerHTML = '';
    const warehouseSelectAllOption = document.createElement('div');
    warehouseSelectAllOption.className = 'option';
    warehouseSelectAllOption.id = 'warehouseSelectAll';
    warehouseSelectAllOption.innerHTML = `
      <input type="checkbox" id="selectAllWarehouses">
      <label for="selectAllWarehouses">全选</label>
    `;
    warehouseOptions.appendChild(warehouseSelectAllOption);
    
    allWarehouses.forEach(wh => {
      const option = document.createElement('div');
      option.className = 'option';
      option.innerHTML = `
        <input type="checkbox" id="wh-${wh}" value="${wh}">
        <label for="wh-${wh}">${wh}</label>
      `;
      warehouseOptions.appendChild(option);
    });
    
    // 添加到商品多选框
    productOptions.innerHTML = '';
    const productSelectAllOption = document.createElement('div');
    productSelectAllOption.className = 'option';
    productSelectAllOption.id = 'productSelectAll';
    productSelectAllOption.innerHTML = `
      <input type="checkbox" id="selectAllProducts">
      <label for="selectAllProducts">全选</label>
    `;
    productOptions.appendChild(productSelectAllOption);
    
    allProductsData.forEach(p => {
      const option = document.createElement('div');
      option.className = 'option';
      option.innerHTML = `
        <input type="checkbox" id="product-${p.product_id}" value="${p.product_id}">
        <label for="product-${p.product_id}">${p.product_name}</label>
      `;
      productOptions.appendChild(option);
    });
    
    // 添加品牌选项
    brandOptions.innerHTML = '';
    const brandSelectAllOption = document.createElement('div');
    brandSelectAllOption.className = 'option';
    brandSelectAllOption.id = 'brandSelectAll';
    brandSelectAllOption.innerHTML = `
      <input type="checkbox" id="selectAllBrands">
      <label for="selectAllBrands">全选</label>
    `;
    brandOptions.appendChild(brandSelectAllOption);
    
    allBrands.forEach(brand => {
      const option = document.createElement('div');
      option.className = 'option';
      option.innerHTML = `
        <input type="checkbox" id="brand-${brand}" value="${brand}">
        <label for="brand-${brand}">${brand}</label>
      `;
      brandOptions.appendChild(option);
    });
    
    // 初始化多选下拉框
    setupMultiselect(
      warehouseSelector,
      warehouseOptions,
      document.getElementById('selectAllWarehouses'),
      selectedWarehouses,
      allWarehouses.map(wh => ({ value: wh, label: wh })),
      '选择仓库'
    );
    
    // 添加品牌变化监听器
    brandSelector.addEventListener('change', () => {
      // 当品牌选择变化时，清除已选商品
      selectedProducts.length = 0;

      // 重置商品下拉框的显示
      const displayElement = productSelector.querySelector('.selected-display');
      displayElement.innerHTML = '';
      
      // 重置占位符显示
      const placeholder = productSelector.querySelector('.placeholder');
      placeholder.textContent = '选择商品';
      placeholder.style.display = 'block';
      
      // 重置清除按钮状态
      const clearBtn = productSelector.querySelector('.clear-btn');
      clearBtn.style.display = 'none';
      
      // 重置箭头图标
      const arrow = productSelector.querySelector('.arrow');
      arrow.style.display = 'block';
      arrow.classList.remove('fa-times');
      arrow.classList.add('fa-chevron-down');
      
      // 清除所有商品复选框的选中状态
      const productCheckboxes = productOptions.querySelectorAll('input[type="checkbox"]');
      productCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
      });

      // 根据新选择的品牌过滤商品
      filterProductsByBrand();      
    });
    
    setupMultiselect(
      brandSelector,
      brandOptions,
      document.getElementById('selectAllBrands'),
      selectedBrands,
      allBrands.map(brand => ({ value: brand, label: brand })),
      '选择品牌'
    );
    
    setupMultiselect(
      productSelector,
      productOptions,
      document.getElementById('selectAllProducts'),
      selectedProducts,
      allProductsData.map(p => ({ 
        value: p.product_id, 
        label: p.product_name 
      })),
      '选择商品'
    );

    // 初始化显示"全部"
    updateMultiselectDisplay(warehouseSelector, [], [], '仓库');
    updateMultiselectDisplay(brandSelector, [], [], '品牌');
    updateMultiselectDisplay(productSelector, [], [], '商品');
    
  } catch (error) {
    console.error('加载筛选选项失败:', error);
    alert('筛选选项加载失败: ' + error.message);
  }
}

function filterProductsByBrand() {
    // 清空商品选项容器
    productOptions.innerHTML = '';

    // 不要重置商品选择数组，保留当前选择
    // selectedProducts = []; // 移除这行
  
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
    let displayBrandCount = selectedBrands.length;

    // 根据品牌筛选商品
    if (displayBrandCount > 0) {
        filteredProducts = allProductsData.filter(p => 
            brandMap[p.product_id] && selectedBrands.includes(brandMap[p.product_id])
        );
    } else {
        filteredProducts = allProductsData;
        displayBrandCount = '全部';
    }

    // 创建选项映射，用于UI更新
    const productOptionsMap = filteredProducts.map(p => ({
        value: p.product_id,
        label: p.product_name
    }));

    // 添加商品选项
    filteredProducts.forEach(product => {
        const option = document.createElement('div');
        option.className = 'option';
        
        const isSelected = selectedProducts.includes(product.product_id);

        option.innerHTML = `
            <input type="checkbox" id="product-${product.product_id}" 
                   value="${product.product_id}" ${isSelected ? 'checked' : ''}>
            <label for="product-${product.product_id}">${product.product_name}</label>
        `;
        productOptions.appendChild(option);
    });

    // 更新商品下拉框文本
    const placeholder = productSelector.querySelector('.placeholder');
    if (selectedBrands.length === 0) {
        placeholder.textContent = '全部商品';
    } else {
        placeholder.textContent = `已筛选${displayBrandCount}个品牌`;
    }
  
    // 重新绑定商品选项事件
    const productSelectAll = document.getElementById('selectAllProducts');
    productSelectAll.addEventListener('change', (e) => {
        const checkboxes = productOptions.querySelectorAll('input[type="checkbox"]:not(#selectAllProducts)');
        
        if (e.target.checked) {
            selectedProducts = []; // 重置选择
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
                selectedProducts.push(checkbox.value);
            });
        } else {
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            selectedProducts = [];
        }
        
        // 使用正确的选项映射
        updateMultiselectDisplay(
            productSelector, 
            selectedProducts, 
            productOptionsMap, 
            '商品'
        );
        
        loadData();
    });
  
    // 绑定单个商品选项事件
    const productOptionCheckboxes = productOptions.querySelectorAll('input[type="checkbox"]:not(#selectAllProducts)');
    productOptionCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const value = e.target.value;
            
            if (e.target.checked) {
                if (!selectedProducts.includes(value)) {
                    selectedProducts.push(value);
                }
            } else {
                const index = selectedProducts.indexOf(value);
                if (index > -1) {
                    selectedProducts.splice(index, 1);
                }
            }
            
            // 更新全选状态
            const allChecked = Array.from(productOptionCheckboxes).every(cb => cb.checked);
            document.getElementById('selectAllProducts').checked = allChecked;
            
            // 修复：传递正确的选项映射
            updateMultiselectDisplay(
                productSelector, 
                selectedProducts, 
                productOptionsMap, 
                '商品'
            );
            
            loadData();    
        });
    });
  
    // 更新商品下拉框显示状态
    updateMultiselectDisplay(
        productSelector, 
        selectedProducts, 
        productOptionsMap, 
        '商品'
    );
}

async function loadData() {
  // 检查用户是否登录
  if (!user) {
    alert('请先登录系统');
    return;
  }  
  if (!supabaseClient) {
    alert('系统未初始化，请刷新页面');
    return;
  }

  loadingEl.style.display = 'block';
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

    // 仓库筛选
    if (selectedWarehouses.length > 0) {
      query = query.in('warehouse', selectedWarehouses);
    }

    // 品牌筛选：直接使用销售记录中的品牌字段
    if (selectedBrands.length > 0) {
      query = query.in('brand', selectedBrands);
    }

    // 商品筛选
    if (selectedProducts.length > 0) {
      query = query.in('product_id', selectedProducts);
    }

    const { data, error } = await query;

    if (error) throw error;

    renderDetailTable(data);
    calculateSummary(data);

  } catch (error) {
    console.error('查询错误详情:', {
      message: error.message,
      details: error.details,
      code: error.code
    });
    loadingEl.innerHTML = `
      <div style="color: #e53e3e; padding: 1rem;">
        <p style="font-size: 1.2rem; margin-bottom: 0.5rem;"><i class="fas fa-exclamation-triangle"></i> 数据加载失败</p>
        <p>错误: ${error.message}</p>
      </div>
    `;
  } finally {
    setTimeout(() => {
      loadingEl.style.display = 'none';
      loadingEl.innerHTML = '<div class="spinner"></div><p>正在加载数据，请稍候...</p>';
    }, 2000);
  }
}

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
    const key = `${record.sale_date}-${record.brand}`;
    
    if (!summaryMap.has(key)) {
      summaryMap.set(key, {
        sale_date: record.sale_date,
        brand: record.brand,
        total_quantity: 0,
        total_amount: 0
      });
    }
    
    const summary = summaryMap.get(key);
    summary.total_quantity += (record.quantity || 0);
    summary.total_amount += (record.quantity || 0) * (record.unit_price || 0);
  });
  
  // 渲染汇总表格
  summaryTable.innerHTML = '';
  
  if (summaryMap.size === 0) {
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
  
  // 按日期和品牌排序
  const sortedSummaries = Array.from(summaryMap.values()).sort((a, b) => {
    if (a.sale_date === b.sale_date) {
      return a.brand.localeCompare(b.brand);
    }
    return a.sale_date.localeCompare(b.sale_date);
  });
  
  sortedSummaries.forEach(summary => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${summary.sale_date || '--'}</td>
      <td>${summary.brand || '--'}</td>
      <td>${formatNumber(summary.total_quantity)}</td>
      <td>¥${formatNumber(summary.total_amount)}</td>
    `;
    summaryTable.appendChild(row);
  });
}

// 清除筛选条件
function clearFilters() {
  startDateEl.value = '';
  endDateEl.value = '';
  
  // 清除仓库多选
  selectedWarehouses = [];
  warehouseSelector.querySelector('.placeholder').textContent = '全部仓库';
  const warehouseCheckboxes = warehouseOptions.querySelectorAll('input[type="checkbox"]');
  warehouseCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  
  // 清除品牌多选
  selectedBrands = [];
  const brandCheckboxes = brandOptions.querySelectorAll('input[type="checkbox"]');
  brandCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  
  // 清除商品多选
  selectedProducts = [];
  const productCheckboxes = productOptions.querySelectorAll('input[type="checkbox"]');
  productCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  
  // 重置商品列表（显示所有商品）
  filterProductsByBrand();
  
  // 更新显示
  updateMultiselectDisplay(brandSelector, [], [], '品牌');
  updateMultiselectDisplay(productSelector, [], [], '商品');
  
  // 重新设置默认日期
  setDefaultDates();

  // 清除后立即刷新数据
  loadData();
}

// 切换详细记录显示状态
function toggleDetailSection() {
  detailSection.classList.toggle('visible');
  if (detailSection.classList.contains('visible')) {
    toggleDetails.innerHTML = '<i class="fas fa-chevron-up"></i> 点击隐藏详细销售记录';
  } else {
    toggleDetails.innerHTML = '<i class="fas fa-chevron-down"></i> 点击显示详细销售记录';
  }
}

// 在DOMContentLoaded事件中初始化认证
document.addEventListener('DOMContentLoaded', async () => {
  // 获取认证相关的DOM元素
  authContainer = document.getElementById('authContainer');
  appContainer = document.getElementById('appContainer');
  loginForm = document.getElementById('loginForm');
  registerForm = document.getElementById('registerForm');
  loginEmail = document.getElementById('loginEmail');
  loginPassword = document.getElementById('loginPassword');
  registerEmail = document.getElementById('registerEmail');
  registerPassword = document.getElementById('registerPassword');
  registerPhone = document.getElementById('registerPhone');
  loginBtn = document.getElementById('loginBtn');
  registerBtn = document.getElementById('registerBtn');
  forgotPasswordLink = document.getElementById('forgotPasswordLink');
  authTabs = document.querySelectorAll('.auth-tab');

  // 初始化时检查用户登录状态
  async function initAuth() {
    if (!supabaseClient) {
      console.error('Supabase客户端未初始化');
      return false;
    }
    
    const { data: { user: currentUser }, error } = await supabaseClient.auth.getUser();
    
    if (currentUser) {
      user = currentUser;
      authContainer.style.display = 'none';
      appContainer.style.display = 'block';
      console.log('用户已登录:', user.email);
      return true;
    } else {
      console.log('用户未登录');
      return false;
    }
  }

  // 标签切换功能
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      
      // 更新标签状态
      authTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // 更新表单显示
      loginForm.classList.remove('active');
      registerForm.classList.remove('active');
      
      if (tabId === 'login') {
        loginForm.classList.add('active');
      } else {
        registerForm.classList.add('active');
      }
    });
  });

  // 登录功能
  loginBtn.addEventListener('click', async () => {
    const email = loginEmail.value;
    const password = loginPassword.value;
    
    if (!email || !password) {
      alert('请输入邮箱和密码');
      return;
    }
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('登录错误:', error);
      alert(`登录失败: ${error.message}`);
      return;
    }
    
    user = data.user;
    authContainer.style.display = 'none';
    appContainer.style.display = 'block';
    console.log('登录成功:', user.email);
    
    // 登录成功后初始化应用
    initializeApp();
  });

  // 注册功能
  registerBtn.addEventListener('click', async () => {
    const email = registerEmail.value;
    const password = registerPassword.value;
    const phone = registerPhone.value;
    
    if (!email || !password) {
      alert('请输入邮箱和密码');
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
    
    const { data, error } = await supabaseClient.auth.signUp(signUpOptions);
    
    if (error) {
      console.error('注册错误:', error);
      alert(`注册失败: ${error.message}`);
      return;
    }
    
    alert('注册成功! 请检查您的邮箱进行验证');
    
    // 切换到登录表单
    authTabs.forEach(t => t.classList.remove('active'));
    document.querySelector('.auth-tab[data-tab="login"]').classList.add('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    
    // 预填充登录表单
    loginEmail.value = email;
  });

  // 忘记密码功能
  forgotPasswordLink.addEventListener('click', async () => {
    const email = loginEmail.value;
    
    if (!email) {
      alert('请输入您的邮箱');
      return;
    }
    
    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://rickyones.github.io/sales-dashboard/auth/callback'
    });
    
    if (error) {
      console.error('密码重置错误:', error);
      alert(`发送重置邮件失败: ${error.message}`);
      return;
    }
    
    alert('密码重置邮件已发送，请检查您的邮箱');
  });

  // 初始化认证状态
  const isAuthenticated = await initAuth();
  
  // 如果用户已登录，初始化应用
  if (isAuthenticated) {
    initializeApp();
  }
});