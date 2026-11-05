// Staff Management System for Education Office of Talosenchey District
// ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យបុគ្គលិកអប់រំ ស្រុកតាលោសែនជ័យ

const STORAGE_KEY = 'talosenchey_staff_data_v1';
const SUPABASE_CONFIG_KEY = 'talosenchey_supabase_cfg_v1';
const DEFAULT_SUPABASE_URL = 'https://muygvatrxuoejopnmudh.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_NHlDaeyuf4Zex8i4CXK4-Q_WincTGwl';

// Salary scales lookup table
const SALARY_SCALE_RATES = {
  "ក១.១": 1446500, "ក១.២": 1396530, "ក១.៣": 1349190, "ក១.៤": 1304480, "ក១.៥": 1259770, "ក១.៦": 1212430,
  "ក២.១": 1165090, "ក២.២": 1120380, "ក២.៣": 1078300, "ក២.៤": 1036220,
  "ក៣.១": 996770,  "ក៣.២": 957320,  "ក៣.៣": 931020,  "ក៣.៤": 907350,
  "ខ១.១": 1236100, "ខ១.២": 1191390, "ខ១.៣": 1146680, "ខ១.៤": 1107230, "ខ១.៥": 1070410, "ខ១.៦": 1033590,
  "ខ២.១": 999400,  "ខ២.២": 970470,  "ខ២.៣": 941540,  "ខ២.៤": 904720,
  "ខ៣.១": 870530,  "ខ៣.២": 836340,  "ខ៣.៣": 810040,  "ខ៣.៤": 789000,
  "គ.១": 1025700,  "គ.២": 973100,   "គ.៣": 925760,   "គ.៤": 881050,   "គ.៥": 844230,   "គ.៦": 807410,
  "គ.៧": 775850,   "គ.៨": 746920,   "គ.៩": 720620,   "គ.១០": 696950
};

const POSITION_ALLOWANCE_RATES = {
  "នាយកសាលាបឋមសិក្សា": 900000,
  "នាយករងសាលាបឋមសិក្សា": 810000,
  "គ្រូបង្រៀនកម្រិតបឋម": 800000,
  "គ្រូបង្រៀនកម្រិតមូលដ្ឋាន": 810000,
  "គ្រូបង្រៀនកម្រិតឧត្តម (បង្រៀននៅវិទ្យាល័យ)": 820000,
  "នាយកសាលាមត្តេយ្យសិក្សា": 890000,
  "នាយករងមត្តេយ្យសិក្សា": 810000,
  "គ្រូបង្រៀនមត្តេយ្យសិក្សា": 800000,
  "នាយកអនុវិទ្យាល័យ": 920000,
  "នាយករងអនុវិទ្យាល័យ": 820000,
  "នាយកវិទ្យាល័យ": 942500,
  "នាយករងវិទ្យាល័យ": 830000,
  "អធិការបឋមសិក្សា": 840000,
  "គ្រូបង្រៀនកិច្ចសន្យា": 0,
  "គ្រូកិច្ចព្រមព្រៀង": 0
};

// Application State
const state = {
  staffList: [],
  filters: {
    search: '',
    staffType: 'ALL',
    commune: 'ALL',
    school: 'ALL',
    gender: 'ALL'
  },
  pagination: {
    currentPage: 1,
    pageSize: 25
  },
  viewMode: 'full_profile', // 'full_profile' or 'allowance'
  activeTab: 'staff-list',
  formTab: 'personal',
  editingId: null,
  viewingId: null,
  deleteTargetId: null,
  supabase: {
    url: '',
    key: '',
    client: null,
    connected: false
  }
};

// Initialize App
function initApp() {
  loadData();
  populateSchoolFilterDropdown();
  setupEventListeners();
  initSupabase();
  render();
}

// Load data from LocalStorage or Seed Data
function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      state.staffList = JSON.parse(stored);
    } else if (typeof INITIAL_STAFF_DATA !== 'undefined') {
      state.staffList = JSON.parse(JSON.stringify(INITIAL_STAFF_DATA));
      saveData();
    } else {
      state.staffList = [];
    }
  } catch (err) {
    console.error('Error loading data:', err);
    state.staffList = typeof INITIAL_STAFF_DATA !== 'undefined' ? JSON.parse(JSON.stringify(INITIAL_STAFF_DATA)) : [];
  }
}

// Save data to LocalStorage
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.staffList));
  } catch (err) {
    console.error('Error saving data:', err);
  }
}

// Reset data to initial seed
function resetToDefault() {
  if (confirm('តើលោកអ្នកពិតជាចង់កំណត់ទិន្នន័យដើម (២១៣ នាក់) ឡើងវិញមែនទេ? ការកែប្រែទាំងអស់នឹងត្រូវបាត់បង់។')) {
    state.staffList = JSON.parse(JSON.stringify(INITIAL_STAFF_DATA));
    saveData();
    showToast('បានកំណត់ទិន្នន័យដើមឡើងវិញដោយជោគជ័យ!', 'success');
    render();
  }
}

// Format numbers with commas
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num) || num === '') return '0';
  return Number(num).toLocaleString('en-US');
}

// Populate School Dropdown Options
function populateSchoolFilterDropdown() {
  const select = document.getElementById('filterSchool');
  if (!select) return;
  
  const schools = Array.from(new Set(state.staffList.map(s => s.school_name).filter(Boolean))).sort();
  const currentVal = select.value;
  select.innerHTML = '<option value="ALL">គ្រប់សាលារៀនទាំងអស់ (៣២ សាលា)</option>';
  schools.forEach(school => {
    const opt = document.createElement('option');
    opt.value = school;
    opt.textContent = school;
    select.appendChild(opt);
  });
  if (currentVal) select.value = currentVal;
}

// Filter staff list according to criteria
function getFilteredStaff() {
  const query = state.filters.search.trim().toLowerCase();
  
  return state.staffList.filter(item => {
    if (query) {
      const matchKhmer = (item.name_kh || '').toLowerCase().includes(query);
      const matchEn = (item.name_en || '').toLowerCase().includes(query);
      const matchStaffId = (item.staff_id || '').toLowerCase().includes(query);
      const matchAcc = (item.account_number || '').toLowerCase().includes(query);
      const matchSchool = (item.school_name || '').toLowerCase().includes(query);
      const matchCommune = (item.commune_name || '').toLowerCase().includes(query);
      const matchPhone = (item.phone || '').toLowerCase().includes(query);
      const matchNationalId = (item.national_id || '').toLowerCase().includes(query);
      const matchPosition = (item.position || '').toLowerCase().includes(query);
      const matchNote = (item.note || '').toLowerCase().includes(query);
      
      if (!matchKhmer && !matchEn && !matchStaffId && !matchAcc && !matchSchool && 
          !matchCommune && !matchPhone && !matchNationalId && !matchPosition && !matchNote) {
        return false;
      }
    }
    
    if (state.filters.staffType !== 'ALL') {
      if (item.staff_type !== state.filters.staffType) return false;
    }
    
    if (state.filters.commune !== 'ALL') {
      if (item.commune_code !== state.filters.commune) return false;
    }
    
    if (state.filters.school !== 'ALL') {
      if (item.school_name !== state.filters.school) return false;
    }
    
    if (state.filters.gender !== 'ALL') {
      if (item.gender !== state.filters.gender) return false;
    }
    
    return true;
  });
}

// Render the application
function render() {
  renderStatistics();
  renderStaffTable();
  renderSchoolSummary();
}

// Render top statistics cards
function renderStatistics() {
  const total = state.staffList.length;
  const civilCount = state.staffList.filter(x => x.staff_type === 'ក្របខណ្ឌ').length;
  const contractCount = state.staffList.filter(x => x.staff_type === 'កិច្ចសន្យា').length;
  const agreementCount = state.staffList.filter(x => x.staff_type === 'គ្រូកិច្ចព្រមព្រៀង').length;
  
  const femaleCount = state.staffList.filter(x => x.gender === 'ស').length;
  const maleCount = state.staffList.filter(x => x.gender === 'ប').length;
  
  const totalBaseSalary = state.staffList.reduce((acc, curr) => acc + Number(curr.base_salary || 0), 0);
  
  const talaoStaff = state.staffList.filter(x => x.commune_code === '150701');
  const talaoBaseSalary = talaoStaff.reduce((acc, curr) => acc + Number(curr.base_salary || 0), 0);
  
  const phteahRungStaff = state.staffList.filter(x => x.commune_code === '150702');
  const phteahRungBaseSalary = phteahRungStaff.reduce((acc, curr) => acc + Number(curr.base_salary || 0), 0);

  setText('statTotalStaff', formatNumber(total));
  setText('statCivilCount', formatNumber(civilCount));
  setText('statContractCount', formatNumber(contractCount));
  setText('statAgreementCount', formatNumber(agreementCount));
  setText('statFemaleCount', formatNumber(femaleCount));
  setText('statMaleCount', formatNumber(maleCount));
  
  setText('statTotalBaseSalary', formatNumber(totalBaseSalary) + ' ៛');
  setText('statTalaoSummary', `${talaoStaff.length} នាក់ (${formatNumber(talaoBaseSalary)} ៛)`);
  setText('statPhteahRungSummary', `${phteahRungStaff.length} នាក់ (${formatNumber(phteahRungBaseSalary)} ៛)`);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Quick inline update for any field (saves immediately to central Supabase cloud)
async function updateStaffField(id, field, value) {
  const item = state.staffList.find(x => x.id === id);
  if (!item) return;
  
  if (field === 'base_salary' || field === 'position_allowance' || field === 'family_children' || field === 'family_spouse') {
    const cleaned = value.toString().replace(/,/g, '').trim();
    item[field] = cleaned === '' ? 0 : Number(cleaned);
  } else {
    item[field] = value.trim();
  }
  
  saveData();
  renderStatistics();
  
  // Real-time Supabase update into central database
  if (state.supabase.connected && state.supabase.client) {
    const patch = { [field]: item[field], updated_at: new Date().toISOString() };
    const { error } = await state.supabase.client
      .from('staff_members')
      .update(patch)
      .eq('id', id);
    if (error) {
      console.warn('Supabase update error:', error);
      showToast(`បរាជ័យក្នុងការរក្សាទុកលើ Cloud: ${error.message}`, 'error');
      return;
    }
    showToast(`☁️ បានរក្សាទុកក្នុងប្រព័ន្ធរួម៖ ${item.name_kh}`, 'success');
  } else {
    showToast(`បានកែប្រែ ${item.name_kh} ដោយជោគជ័យ!`, 'success');
  }
}

// Toggle between Full Official Profile Table and Allowance Table
function setTableViewMode(mode) {
  state.viewMode = mode;
  const btnFull = document.getElementById('btnModeFull');
  const btnAllowance = document.getElementById('btnModeAllowance');
  
  if (btnFull && btnAllowance) {
    if (mode === 'full_profile') {
      btnFull.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-900 text-white shadow-xs';
      btnAllowance.className = 'px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-200 transition';
    } else {
      btnAllowance.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-900 text-white shadow-xs';
      btnFull.className = 'px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-200 transition';
    }
  }
  
  renderTableHeader();
  renderStaffTable();
}

// Render dynamic table header depending on View Mode
function renderTableHeader() {
  const thead = document.getElementById('staffTableHead');
  if (!thead) return;
  
  if (state.viewMode === 'full_profile') {
    // Exact official multi-level header from the uploaded image
    thead.innerHTML = `
      <tr class="bg-blue-900 text-white text-xs font-semibold border-b border-blue-800 text-center">
        <th rowspan="2" class="py-2.5 px-2 border-r border-blue-800/80 w-10">ល.រ</th>
        <th rowspan="2" class="py-2.5 px-3 border-r border-blue-800/80 whitespace-nowrap">អត្តលេខមន្ត្រីរាជការ</th>
        <th rowspan="2" class="py-2.5 px-3 border-r border-blue-800/80 whitespace-nowrap">ឈ្មោះមន្ត្រីរាជការ(ខ្មែរ)</th>
        <th rowspan="2" class="py-2.5 px-3 border-r border-blue-800/80 whitespace-nowrap">ឈ្មោះមន្ត្រីរាជការ(ឡាតាំង)</th>
        <th rowspan="2" class="py-2.5 px-2 border-r border-blue-800/80 w-12">ភេទ</th>
        <th rowspan="2" class="py-2.5 px-3 border-r border-blue-800/80 whitespace-nowrap">ថ្ងៃខែឆ្នាំកំណើត</th>
        <th colspan="4" class="py-1.5 px-2 border-r border-blue-800/80 bg-blue-950/40">ទីកន្លែងកំណើត</th>
        <th rowspan="2" class="py-2.5 px-3 border-r border-blue-800/80 whitespace-nowrap">ថ្ងៃខែឆ្នាំចូលបម្រើការជាមន្ត្រីរាជការ</th>
        <th rowspan="2" class="py-2.5 px-3 border-r border-blue-800/80 whitespace-nowrap">ថ្ងៃខែឆ្នាំតាំងស៊ប់ក្នុងក្របខ័ណ្ឌ</th>
        <th rowspan="2" class="py-2.5 px-3 border-r border-blue-800/80 bg-blue-800/60 whitespace-nowrap">ប្រាក់បៀវត្សមូលដ្ឋាន</th>
        <th rowspan="2" class="py-2.5 px-3 border-r border-blue-800/80 whitespace-nowrap">ប្រាក់បំណាច់មុខងារ</th>
        <th rowspan="2" class="py-2.5 px-3 border-r border-blue-800/80 whitespace-nowrap">មុខងារ</th>
        <th colspan="2" class="py-1.5 px-2 border-r border-blue-800/80 bg-blue-950/40">ប្រាក់វិភាជន៍គ្រួសារ</th>
        <th colspan="2" class="py-1.5 px-2 border-r border-blue-800/80 bg-blue-950/40">ឋានន្តរស័ក្តិ និងថ្នាក់ដំឡើងចុងក្រោយ</th>
        <th colspan="3" class="py-1.5 px-2 border-r border-blue-800/80 bg-blue-950/40">អត្តសញ្ញាប័ណ្ណសញ្ញជាតិខ្មែរ</th>
        <th rowspan="2" class="py-2.5 px-3 border-r border-blue-800/80 whitespace-nowrap">គណនីធនាគារ</th>
        <th rowspan="2" class="py-2.5 px-3 border-r border-blue-800/80 whitespace-nowrap">លេខទូរសព្ទ</th>
        <th rowspan="2" class="py-2.5 px-2 no-print w-16">សកម្មភាព</th>
      </tr>
      <tr class="bg-blue-950 text-blue-100 text-[11px] font-medium border-b border-blue-800 text-center">
        <!-- Sub-headers for ទីកន្លែងកំណើត -->
        <th class="py-1.5 px-2 border-r border-blue-800/60 whitespace-nowrap">រាជធានី/ខេត្ត</th>
        <th class="py-1.5 px-2 border-r border-blue-800/60 whitespace-nowrap">ក្រុង/ស្រុក/ខណ្ឌ</th>
        <th class="py-1.5 px-2 border-r border-blue-800/60 whitespace-nowrap">ឃុំ/សង្កាត់</th>
        <th class="py-1.5 px-2 border-r border-blue-800/60 whitespace-nowrap">ភូមិ</th>
        <!-- Sub-headers for ប្រាក់វិភាជន៍ -->
        <th class="py-1.5 px-2 border-r border-blue-800/60 whitespace-nowrap">កូន</th>
        <th class="py-1.5 px-2 border-r border-blue-800/60 whitespace-nowrap">សហព័ទ្ធ</th>
        <!-- Sub-headers for ឋានន្តរស័ក្តិ -->
        <th class="py-1.5 px-2 border-r border-blue-800/60 whitespace-nowrap">តាមប្រភេទ</th>
        <th class="py-1.5 px-2 border-r border-blue-800/60 whitespace-nowrap">កាលបរិច្ឆេទ</th>
        <!-- Sub-headers for អត្តសញ្ញាប័ណ្ណ -->
        <th class="py-1.5 px-2 border-r border-blue-800/60 whitespace-nowrap">លេខអត្តសញ្ញាប័ណ្ណ</th>
        <th class="py-1.5 px-2 border-r border-blue-800/60 whitespace-nowrap">សុពលភាពចាប់ពី</th>
        <th class="py-1.5 px-2 border-r border-blue-800/60 whitespace-nowrap">ផុតសុពលភាពថ្ងៃ</th>
      </tr>
    `;
  } else {
    // Compact Allowance View
    thead.innerHTML = `
      <tr class="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
        <th class="py-3 px-3 text-center w-12">ល.រ</th>
        <th class="py-3 px-3">អត្តលេខ</th>
        <th class="py-3 px-3 text-center">ប្រភេទ</th>
        <th class="py-3 px-4">គោត្តនាម-នាម</th>
        <th class="py-3 px-3 text-center">ភេទ</th>
        <th class="py-3 px-3">លេខគណនីធនាគារ</th>
        <th class="py-3 px-4">សាលារៀន/អង្គភាព</th>
        <th class="py-3 px-3">ឃុំ</th>
        <th class="py-3 px-3 text-right bg-blue-50/60 text-blue-900">ប្រាក់មូលដ្ឋាន</th>
        <th class="py-3 px-3 text-center no-print">សកម្មភាព</th>
      </tr>
    `;
  }
}

// Render Staff Data Table Rows
function renderStaffTable() {
  const filtered = getFilteredStaff();
  const totalFiltered = filtered.length;
  
  const { currentPage, pageSize } = state.pagination;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  state.pagination.currentPage = safePage;
  
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageItems = pageSize === 9999 ? filtered : filtered.slice(startIdx, endIdx);
  
  const tbody = document.getElementById('staffTableBody');
  if (!tbody) return;
  
  const colSpan = state.viewMode === 'full_profile' ? 23 : 10;
  
  if (pageItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${colSpan}" class="py-12 text-center text-gray-500">
          <div class="flex flex-col items-center justify-center">
            <svg class="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-base font-medium">រកមិនឃើញទិន្នន័យដែលផ្គូផ្គងនឹងការស្វែងរកទេ</p>
            <p class="text-sm text-gray-400 mt-1">សូមសាកល្បងផ្លាស់ប្តូរពាក្យស្វែងរក ឬសម្អាតជម្រើសចម្រាញ់</p>
          </div>
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = pageItems.map((item, idx) => {
      const displayIndex = startIdx + idx + 1;
      
      const genderBadge = item.gender === 'ស' 
        ? '<span class="text-pink-600 font-semibold">ស្រី</span>' 
        : '<span class="text-blue-600 font-semibold">ប្រុស</span>';

      const baseSalaryVal = (item.base_salary !== undefined && item.base_salary !== null && item.base_salary > 0)
        ? item.base_salary 
        : '';
        
      const posAllowanceVal = (item.position_allowance !== undefined && item.position_allowance !== null && item.position_allowance > 0)
        ? item.position_allowance
        : '';

      if (state.viewMode === 'full_profile') {
        // Full official view matching the uploaded image
        return `
          <tr class="hover:bg-blue-50/50 transition-colors border-b border-gray-200 text-xs">
            <td class="py-2 px-2 text-center text-gray-500 font-mono">${displayIndex}</td>
            <td class="py-2 px-2 font-mono font-semibold text-blue-900 whitespace-nowrap">${item.staff_id || '-'}</td>
            <td class="py-2 px-3 font-medium text-gray-900 whitespace-nowrap">${item.name_kh}</td>
            <td class="py-2 px-3 font-mono text-gray-600 whitespace-nowrap">${item.name_en || '-'}</td>
            <td class="py-2 px-2 text-center whitespace-nowrap">${genderBadge}</td>
            <td class="py-2 px-2 font-mono text-center whitespace-nowrap text-gray-700">${item.dob || '-'}</td>
            
            <!-- POB (ទីកន្លែងកំណើត) -->
            <td class="py-2 px-2 whitespace-nowrap text-gray-700">${item.pob_province || '-'}</td>
            <td class="py-2 px-2 whitespace-nowrap text-gray-700">${item.pob_district || '-'}</td>
            <td class="py-2 px-2 whitespace-nowrap text-gray-700">${item.pob_commune || '-'}</td>
            <td class="py-2 px-2 whitespace-nowrap text-gray-700">${item.pob_village || '-'}</td>
            
            <td class="py-2 px-2 font-mono text-center whitespace-nowrap text-gray-700">${item.join_date || '-'}</td>
            <td class="py-2 px-2 font-mono text-center whitespace-nowrap text-gray-700">${item.tenure_date || '-'}</td>
            
            <!-- Base Salary (ប្រាក់បៀវត្សមូលដ្ឋាន) -->
            <td class="py-1.5 px-2 text-right whitespace-nowrap bg-blue-50/40">
              <input type="number" 
                     value="${baseSalaryVal}" 
                     placeholder="បញ្ចូល..." 
                     onchange="updateStaffField(${item.id}, 'base_salary', this.value)" 
                     class="w-24 py-0.5 px-1.5 text-right font-mono text-xs border border-slate-300 rounded bg-white hover:border-blue-400 focus:border-blue-600 outline-none font-semibold text-blue-950"
                     title="ចុចដើម្បីបំពេញប្រាក់មូលដ្ឋាន">
            </td>
            
            <!-- Position Allowance (ប្រាក់បំណាច់មុខងារ) -->
            <td class="py-1.5 px-2 text-right whitespace-nowrap">
              <input type="number" 
                     value="${posAllowanceVal}" 
                     placeholder="បញ្ចូល..." 
                     onchange="updateStaffField(${item.id}, 'position_allowance', this.value)" 
                     class="w-20 py-0.5 px-1.5 text-right font-mono text-xs border border-slate-300 rounded bg-white hover:border-blue-400 focus:border-blue-600 outline-none text-slate-800"
                     title="ចុចដើម្បីបំពេញប្រាក់បំណាច់មុខងារ">
            </td>
            
            <!-- Position (មុខងារ) -->
            <td class="py-2 px-2 whitespace-nowrap text-gray-800 font-medium">${item.position || '<span class="text-gray-400">គ្រូបង្រៀន</span>'}</td>
            
            <!-- Family Allowance (កូន, សហព័ទ្ធ) -->
            <td class="py-2 px-2 text-right font-mono text-gray-700">${formatNumber(item.family_children || 0)}</td>
            <td class="py-2 px-2 text-right font-mono text-gray-700">${formatNumber(item.family_spouse || 0)}</td>
            
            <!-- Rank / Grade & Date - EDITABLE INLINE -->
            <td class="py-1.5 px-2 text-center whitespace-nowrap">
              <input type="text" 
                     list="rankTypeList"
                     value="${item.rank_type || ''}" 
                     placeholder="ឧ. ក១.១" 
                     onchange="updateStaffField(${item.id}, 'rank_type', this.value)" 
                     class="w-20 py-0.5 px-1.5 text-center font-mono text-xs border border-slate-200 rounded bg-white hover:border-blue-400 focus:border-blue-600 outline-none font-semibold text-indigo-900 shadow-2xs"
                     title="ចុចដើម្បីសរសេរបំពេញឋានន្តរស័ក្តិ/កាំប្រាក់">
            </td>
            <td class="py-1.5 px-2 text-center whitespace-nowrap">
              <input type="text" 
                     value="${item.rank_date || ''}" 
                     placeholder="កាលបរិច្ឆេទ..." 
                     onchange="updateStaffField(${item.id}, 'rank_date', this.value)" 
                     class="w-24 py-0.5 px-1.5 text-center font-mono text-xs border border-slate-200 rounded bg-white hover:border-blue-400 focus:border-blue-600 outline-none text-slate-700 shadow-2xs"
                     title="ចុចដើម្បីសរសេរបំពេញកាលបរិច្ឆេទ">
            </td>
            
            <!-- National ID Card -->
            <td class="py-2 px-2 font-mono whitespace-nowrap text-gray-800">${item.national_id || '-'}</td>
            <td class="py-2 px-2 font-mono text-center text-gray-600">${item.id_issue_date || '-'}</td>
            <td class="py-2 px-2 font-mono text-center text-gray-600">${item.id_expiry_date || '-'}</td>
            
            <!-- Account & Phone -->
            <td class="py-2 px-2 font-mono text-gray-700 whitespace-nowrap">${item.account_number || '-'}</td>
            <td class="py-2 px-2 font-mono whitespace-nowrap text-gray-700">
              <input type="text" 
                     value="${item.phone || ''}" 
                     placeholder="លេខទូរសព្ទ..." 
                     onchange="updateStaffField(${item.id}, 'phone', this.value)" 
                     class="w-24 py-0.5 px-1.5 text-xs font-mono border border-slate-200 rounded bg-white hover:border-blue-400 focus:border-blue-600 outline-none">
            </td>
            
            <!-- Actions -->
            <td class="py-2 px-2 text-center whitespace-nowrap no-print">
              <div class="flex items-center justify-center gap-1">
                <button onclick="openViewModal(${item.id})" class="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-100 rounded" title="មើលលម្អិត">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
                <button onclick="openEditModal(${item.id})" class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded" title="កែប្រែទិន្នន័យ">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button onclick="confirmDeleteStaff(${item.id})" class="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded" title="លុប">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      } else {
        // Compact Allowance View
        let typeBadge = '';
        if (item.staff_type === 'ក្របខណ្ឌ') {
          typeBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-civil">ក្របខណ្ឌ</span>';
        } else if (item.staff_type === 'កិច្ចសន្យា') {
          typeBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-contract">កិច្ចសន្យា</span>';
        } else {
          typeBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-agreement">កិច្ចព្រមព្រៀង</span>';
        }

        return `
          <tr class="hover:bg-blue-50/40 transition-colors border-b border-gray-100">
            <td class="py-3 px-3 text-center text-gray-500 font-mono text-sm">${displayIndex}</td>
            <td class="py-3 px-3 font-mono text-sm font-medium text-gray-700 whitespace-nowrap">${item.staff_id || '-'}</td>
            <td class="py-3 px-3 text-center whitespace-nowrap">${typeBadge}</td>
            <td class="py-3 px-4 whitespace-nowrap">
              <div class="font-medium text-gray-900">${item.name_kh}</div>
              <div class="text-xs text-gray-500 font-mono">${item.name_en || ''}</div>
            </td>
            <td class="py-3 px-3 text-center whitespace-nowrap">${genderBadge}</td>
            <td class="py-3 px-3 font-mono text-sm text-gray-600 whitespace-nowrap">
              ${item.account_number ? `<span class="bg-gray-100 px-2 py-0.5 rounded">${item.account_number}</span>` : '<span class="text-red-400 text-xs italic">គ្មានគណនី</span>'}
            </td>
            <td class="py-3 px-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-800">${item.school_name || '<span class="text-gray-400">-</span>'}</div>
              <div class="text-xs text-gray-400 font-mono">${item.school_code || ''}</div>
            </td>
            <td class="py-3 px-3 text-sm text-gray-600 whitespace-nowrap">${item.commune_name || ''}</td>
            <td class="py-2.5 px-3 text-right whitespace-nowrap bg-blue-50/20">
              <input type="number" 
                     value="${baseSalaryVal}" 
                     placeholder="បញ្ចូលប្រាក់..." 
                     onchange="updateStaffField(${item.id}, 'base_salary', this.value)" 
                     class="w-28 sm:w-32 py-1 px-2.5 text-right font-mono text-xs border border-slate-300 rounded-md bg-white hover:border-blue-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                     title="ចុចដើម្បីបំពេញ ឬកែប្រែប្រាក់មូលដ្ឋាន">
              <span class="text-xs text-slate-400 font-medium font-khmer">៛</span>
            </td>
            <td class="py-3 px-3 text-center whitespace-nowrap no-print">
              <div class="flex items-center justify-center gap-1.5">
                <button onclick="openViewModal(${item.id})" class="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded" title="មើលលម្អិត">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
                <button onclick="openEditModal(${item.id})" class="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded" title="កែប្រែ">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button onclick="confirmDeleteStaff(${item.id})" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded" title="លុប">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }
    }).join('');
  }

  const startRecord = totalFiltered === 0 ? 0 : startIdx + 1;
  const endRecord = Math.min(endIdx, totalFiltered);
  setText('paginationInfo', `បង្ហាញពី ${startRecord} ដល់ ${endRecord} នៃទិន្នន័យសរុប ${totalFiltered} នាក់`);
  setText('currentPageDisplay', safePage);
  setText('totalPagesDisplay', totalPages);
  
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  if (prevBtn) prevBtn.disabled = safePage <= 1;
  if (nextBtn) nextBtn.disabled = safePage >= totalPages;
}

// Render Summary per School & Commune Tab
function renderSchoolSummary() {
  const container = document.getElementById('schoolSummaryContainer');
  if (!container) return;
  
  const groups = {
    '150701': { name: 'ឃុំតាលោ (១៥០៧០១)', schools: {} },
    '150702': { name: 'ឃុំផ្ទះរុង (១៥០៧០២)', schools: {} }
  };
  
  state.staffList.forEach(item => {
    const cCode = item.commune_code || '150701';
    if (!groups[cCode]) {
      groups[cCode] = { name: item.commune_name || cCode, schools: {} };
    }
    const sName = item.school_name || 'មិនបានបញ្ជាក់';
    if (!groups[cCode].schools[sName]) {
      groups[cCode].schools[sName] = {
        code: item.school_code || '',
        count: 0,
        civil: 0,
        contract: 0,
        agreement: 0,
        female: 0,
        male: 0,
        base_salary_total: 0
      };
    }
    const s = groups[cCode].schools[sName];
    s.count++;
    if (item.staff_type === 'ក្របខណ្ឌ') s.civil++;
    else if (item.staff_type === 'កិច្ចសន្យា') s.contract++;
    else s.agreement++;
    
    if (item.gender === 'ស') s.female++;
    else s.male++;
    
    s.base_salary_total += Number(item.base_salary || 0);
  });
  
  let html = '';
  
  Object.keys(groups).forEach(cCode => {
    const commune = groups[cCode];
    const schoolNames = Object.keys(commune.schools).sort();
    
    let communeTotalCount = 0;
    let communeTotalCivil = 0;
    let communeTotalContract = 0;
    let communeTotalFemale = 0;
    let communeTotalBaseSalary = 0;
    
    let tableRows = '';
    schoolNames.forEach((sName, idx) => {
      const s = commune.schools[sName];
      communeTotalCount += s.count;
      communeTotalCivil += s.civil;
      communeTotalContract += s.contract;
      communeTotalFemale += s.female;
      communeTotalBaseSalary += s.base_salary_total;
      
      tableRows += `
        <tr class="hover:bg-blue-50/30 border-b border-gray-100">
          <td class="py-2.5 px-3 text-center text-gray-500 font-mono text-sm">${idx + 1}</td>
          <td class="py-2.5 px-4 font-medium text-gray-800">${sName}</td>
          <td class="py-2.5 px-3 text-center font-mono text-xs text-gray-500">${s.code}</td>
          <td class="py-2.5 px-3 text-center font-semibold text-gray-900">${s.count}</td>
          <td class="py-2.5 px-3 text-center text-blue-700 font-medium">${s.civil}</td>
          <td class="py-2.5 px-3 text-center text-emerald-700 font-medium">${s.contract}</td>
          <td class="py-2.5 px-3 text-center text-pink-600">${s.female}</td>
          <td class="py-2.5 px-4 text-right font-mono font-semibold text-slate-800">${formatNumber(s.base_salary_total)} ៛</td>
        </tr>
      `;
    });
    
    html += `
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div class="bg-gradient-to-r from-blue-900 to-indigo-800 text-white px-5 py-3.5 flex justify-between items-center">
          <h3 class="text-base font-bold flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            ${commune.name}
          </h3>
          <div class="text-sm bg-blue-800/60 px-3 py-1 rounded-full font-mono">
            សរុប៖ ${communeTotalCount} នាក់ | ប្រាក់មូលដ្ឋានសរុប៖ ${formatNumber(communeTotalBaseSalary)} ៛
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 text-gray-700 border-b border-gray-200 text-xs font-semibold">
              <tr>
                <th class="py-2.5 px-3 text-center w-12">ល.រ</th>
                <th class="py-2.5 px-4">ឈ្មោះសាលាបឋមសិក្សា</th>
                <th class="py-2.5 px-3 text-center">លេខកូដសាលា</th>
                <th class="py-2.5 px-3 text-center">បុគ្គលិកសរុប</th>
                <th class="py-2.5 px-3 text-center">ក្របខណ្ឌ</th>
                <th class="py-2.5 px-3 text-center">កិច្ចសន្យា</th>
                <th class="py-2.5 px-3 text-center">ស្រី</th>
                <th class="py-2.5 px-4 text-right">សរុបប្រាក់មូលដ្ឋាន</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
            <tfoot class="bg-blue-50 font-semibold text-gray-900 border-t border-gray-300">
              <tr>
                <td colspan="3" class="py-3 px-4 text-right font-bold">សរុបក្នុង${commune.name}៖</td>
                <td class="py-3 px-3 text-center font-bold">${communeTotalCount}</td>
                <td class="py-3 px-3 text-center text-blue-800 font-bold">${communeTotalCivil}</td>
                <td class="py-3 px-3 text-center text-emerald-800 font-bold">${communeTotalContract}</td>
                <td class="py-3 px-3 text-center text-pink-700 font-bold">${communeTotalFemale}</td>
                <td class="py-3 px-4 text-right font-mono font-bold text-slate-800">${formatNumber(communeTotalBaseSalary)} ៛</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Setup Event Listeners
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.filters.search = e.target.value;
      state.pagination.currentPage = 1;
      renderStaffTable();
    });
  }

  setupFilter('filterStaffType', 'staffType');
  setupFilter('filterCommune', 'commune');
  setupFilter('filterSchool', 'school');
  setupFilter('filterGender', 'gender');
  
  const pageSizeSelect = document.getElementById('pageSizeSelect');
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', (e) => {
      state.pagination.pageSize = Number(e.target.value);
      state.pagination.currentPage = 1;
      renderStaffTable();
    });
  }
  
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (state.pagination.currentPage > 1) {
        state.pagination.currentPage--;
        renderStaffTable();
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalFiltered = getFilteredStaff().length;
      const totalPages = Math.ceil(totalFiltered / state.pagination.pageSize) || 1;
      if (state.pagination.currentPage < totalPages) {
        state.pagination.currentPage++;
        renderStaffTable();
      }
    });
  }

  const communeSelect = document.getElementById('fCommune');
  if (communeSelect) {
    communeSelect.addEventListener('change', updateFormSchoolList);
  }
  
  // Listeners for rank scale and position auto-fill in modal
  const rankInput = document.getElementById('fRankType');
  if (rankInput) {
    rankInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      const rate = SALARY_SCALE_RATES[val];
      if (rate && !document.getElementById('fBaseSalary').value) {
        document.getElementById('fBaseSalary').value = rate;
      }
    });
  }

  const posInput = document.getElementById('fPosition');
  if (posInput) {
    posInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      const rate = POSITION_ALLOWANCE_RATES[val];
      if (rate !== undefined && rate > 0 && !document.getElementById('fPositionAllowance').value) {
        document.getElementById('fPositionAllowance').value = rate;
      }
    });
  }

  renderTableHeader();
}

function setupFilter(elementId, stateProp) {
  const el = document.getElementById(elementId);
  if (el) {
    el.addEventListener('change', (e) => {
      state.filters[stateProp] = e.target.value;
      state.pagination.currentPage = 1;
      renderStaffTable();
    });
  }
}

function clearFilters() {
  state.filters = {
    search: '',
    staffType: 'ALL',
    commune: 'ALL',
    school: 'ALL',
    gender: 'ALL'
  };
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  
  const ids = ['filterStaffType', 'filterCommune', 'filterSchool', 'filterGender'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = 'ALL';
  });
  
  state.pagination.currentPage = 1;
  renderStaffTable();
}

function switchTab(tabId) {
  state.activeTab = tabId;
  const tabs = ['staff-list', 'school-summary', 'reference-scale'];
  tabs.forEach(t => {
    const tabBtn = document.getElementById(`tabBtn-${t}`);
    const tabPane = document.getElementById(`tabPane-${t}`);
    if (tabBtn && tabPane) {
      if (t === tabId) {
        tabBtn.className = 'px-4 py-2.5 font-semibold text-blue-900 border-b-2 border-blue-800 flex items-center gap-2 bg-blue-50/50 rounded-t-lg';
        tabPane.classList.remove('hidden');
      } else {
        tabBtn.className = 'px-4 py-2.5 font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-t-lg transition';
        tabPane.classList.add('hidden');
      }
    }
  });
}

// Switch sub-tabs in Form Modal (Personal, Civil, Salary, Contact)
function switchFormTab(tabKey) {
  state.formTab = tabKey;
  const formTabs = ['personal', 'civil', 'salary', 'contact'];
  formTabs.forEach(t => {
    const btn = document.getElementById(`fTabBtn-${t}`);
    const section = document.getElementById(`fTabSection-${t}`);
    if (btn && section) {
      if (t === tabKey) {
        btn.className = 'px-3 py-2 text-xs font-semibold text-blue-800 border-b-2 border-blue-800 bg-blue-50/50';
        section.classList.remove('hidden');
      } else {
        btn.className = 'px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-800';
        section.classList.add('hidden');
      }
    }
  });
}

// Modal management: Add Staff
function openAddModal() {
  state.editingId = null;
  document.getElementById('modalTitle').textContent = 'បន្ថែមបុគ្គលិកថ្មី (ទម្រង់ស្រង់ព័ត៌មានពេញលេញ)';
  document.getElementById('staffForm').reset();
  
  // Set default values
  document.getElementById('fStaffType').value = 'ក្របខណ្ឌ';
  document.getElementById('fGender').value = 'ស';
  document.getElementById('fCommune').value = '150701';
  document.getElementById('fPosition').value = 'គ្រូបង្រៀនកម្រិតបឋម';
  document.getElementById('fRankType').value = 'ក១.១';
  document.getElementById('fBaseSalary').value = SALARY_SCALE_RATES['ក១.១'] || '';
  document.getElementById('fPositionAllowance').value = POSITION_ALLOWANCE_RATES['គ្រូបង្រៀនកម្រិតបឋម'] || '';
  
  updateFormSchoolList();
  switchFormTab('personal');
  openModal('staffFormModal');
}

// Modal management: Edit Staff
function openEditModal(id) {
  const item = state.staffList.find(x => x.id === id);
  if (!item) return;
  
  state.editingId = id;
  document.getElementById('modalTitle').textContent = `កែប្រែទិន្នន័យ៖ ${item.name_kh} (អត្តលេខ ${item.staff_id || item.id})`;
  
  // Tab 1: Personal
  document.getElementById('fStaffType').value = item.staff_type || 'ក្របខណ្ឌ';
  document.getElementById('fStaffId').value = item.staff_id || '';
  document.getElementById('fNameKh').value = item.name_kh || '';
  document.getElementById('fNameEn').value = item.name_en || '';
  document.getElementById('fGender').value = item.gender || 'ស';
  document.getElementById('fDob').value = item.dob || '';
  document.getElementById('fPobProvince').value = item.pob_province || '';
  document.getElementById('fPobDistrict').value = item.pob_district || '';
  document.getElementById('fPobCommune').value = item.pob_commune || '';
  document.getElementById('fPobVillage').value = item.pob_village || '';
  
  // Tab 2: Civil Service
  document.getElementById('fJoinDate').value = item.join_date || '';
  document.getElementById('fTenureDate').value = item.tenure_date || '';
  document.getElementById('fPosition').value = item.position || 'គ្រូបង្រៀនកម្រិតបឋម';
  document.getElementById('fRankType').value = item.rank_type || 'ក១.១';
  document.getElementById('fRankDate').value = item.rank_date || '';
  document.getElementById('fCommune').value = item.commune_code || '150701';
  updateFormSchoolList(item.school_name);
  document.getElementById('fSchoolCode').value = item.school_code || '';
  
  // Tab 3: Salary & Allowance
  document.getElementById('fBaseSalary').value = (item.base_salary !== undefined && item.base_salary !== null && item.base_salary > 0) ? item.base_salary : '';
  document.getElementById('fPositionAllowance').value = (item.position_allowance !== undefined && item.position_allowance !== null && item.position_allowance > 0) ? item.position_allowance : '';
  document.getElementById('fFamilyChildren').value = item.family_children || '';
  document.getElementById('fFamilySpouse').value = item.family_spouse || '';
  
  // Tab 4: ID Card & Contact
  document.getElementById('fNationalId').value = item.national_id || '';
  document.getElementById('fIdIssueDate').value = item.id_issue_date || '';
  document.getElementById('fIdExpiryDate').value = item.id_expiry_date || '';
  document.getElementById('fAccountNumber').value = item.account_number || '';
  document.getElementById('fPhone').value = item.phone || '';
  document.getElementById('fNote').value = item.note || '';
  
  switchFormTab('personal');
  openModal('staffFormModal');
}

// Update school dropdown inside edit modal
function updateFormSchoolList(selectedSchool) {
  const communeSelect = document.getElementById('fCommune');
  const schoolSelect = document.getElementById('fSchoolName');
  if (!communeSelect || !schoolSelect) return;
  
  const cCode = communeSelect.value;
  const communeSchools = state.staffList
    .filter(x => x.commune_code === cCode && x.school_name)
    .reduce((acc, curr) => {
      if (!acc.some(s => s.name === curr.school_name)) {
        acc.push({ name: curr.school_name, code: curr.school_code });
      }
      return acc;
    }, []);
    
  schoolSelect.innerHTML = '<option value="">-- ជ្រើសរើសសាលារៀន --</option>';
  communeSchools.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.name;
    opt.dataset.code = s.code;
    opt.textContent = `${s.name} (${s.code || ''})`;
    schoolSelect.appendChild(opt);
  });
  
  if (selectedSchool) {
    schoolSelect.value = selectedSchool;
  }
}

function onFormSchoolChange() {
  const schoolSelect = document.getElementById('fSchoolName');
  const schoolCodeInput = document.getElementById('fSchoolCode');
  if (schoolSelect && schoolCodeInput) {
    const selectedOpt = schoolSelect.options[schoolSelect.selectedIndex];
    if (selectedOpt && selectedOpt.dataset.code) {
      schoolCodeInput.value = selectedOpt.dataset.code;
    }
  }
}

// Save Staff (Create or Update - directly into central shared database)
async function handleStaffFormSubmit(e) {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnContent = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>កំពុងរក្សាទុកក្នុងប្រព័ន្ធរួម...</span>
    `;
  }

  try {
    const nameKh = document.getElementById('fNameKh').value.trim();
    if (!nameKh) {
      alert('សូមបញ្ចូល គោត្តនាម-នាម (អក្សរខ្មែរ)');
      return;
    }
    
    const staffType = document.getElementById('fStaffType').value;
    let staffId = document.getElementById('fStaffId').value.trim();
    if (!staffId && staffType === 'កិច្ចសន្យា') {
      staffId = 'កិច្ចសន្យា';
    }
    
    const communeCode = document.getElementById('fCommune').value;
    const communeName = communeCode === '150701' ? 'ឃុំតាលោ' : 'ឃុំផ្ទះរុង';
    
    const parseNum = (id) => {
      const val = document.getElementById(id).value.trim();
      return val === '' ? 0 : Number(val);
    };
    
    const gender = document.getElementById('fGender').value;

    let targetId = state.editingId;
    if (targetId === null) {
      // New record: determine next unique ID from Supabase if connected
      if (state.supabase.connected && state.supabase.client) {
        try {
          const { data: maxRows } = await state.supabase.client
            .from('staff_members')
            .select('id')
            .order('id', { ascending: false })
            .limit(1);
          if (maxRows && maxRows.length > 0 && maxRows[0].id) {
            targetId = Number(maxRows[0].id) + 1;
          }
        } catch (idErr) {
          console.warn('Could not query max id from Supabase:', idErr);
        }
      }
      if (!targetId) {
        targetId = state.staffList.length > 0 ? Math.max(...state.staffList.map(x => x.id)) + 1 : 1;
      }
    }
    
    const staffObj = {
      id: targetId,
      staff_id: staffId,
      staff_type: staffType,
      name_kh: nameKh,
      name_en: document.getElementById('fNameEn').value.trim(),
      gender: gender,
      gender_label: gender === 'ស' ? 'ស្រី' : 'ប្រុស',
      dob: document.getElementById('fDob').value.trim(),
      
      // POB
      pob_province: document.getElementById('fPobProvince').value.trim(),
      pob_district: document.getElementById('fPobDistrict').value.trim(),
      pob_commune: document.getElementById('fPobCommune').value.trim(),
      pob_village: document.getElementById('fPobVillage').value.trim(),
      
      // Civil service dates & position
      join_date: document.getElementById('fJoinDate').value.trim(),
      tenure_date: document.getElementById('fTenureDate').value.trim(),
      position: document.getElementById('fPosition').value.trim(),
      rank_type: document.getElementById('fRankType').value.trim(),
      rank_date: document.getElementById('fRankDate').value.trim(),
      
      // Salary & Benefits
      base_salary: parseNum('fBaseSalary'),
      position_allowance: parseNum('fPositionAllowance'),
      family_children: parseNum('fFamilyChildren'),
      family_spouse: parseNum('fFamilySpouse'),
      
      // Organization
      commune_code: communeCode,
      commune_name: communeName,
      school_code: document.getElementById('fSchoolCode').value.trim(),
      school_name: document.getElementById('fSchoolName').value.trim(),
      
      // National ID & Contact
      national_id: document.getElementById('fNationalId').value.trim(),
      id_issue_date: document.getElementById('fIdIssueDate').value.trim(),
      id_expiry_date: document.getElementById('fIdExpiryDate').value.trim(),
      account_number: document.getElementById('fAccountNumber').value.trim(),
      phone: document.getElementById('fPhone').value.trim(),
      note: document.getElementById('fNote').value.trim(),
      updated_at: new Date().toISOString()
    };
    
    // 1. Direct Save into Central Shared Database (Supabase)
    if (state.supabase.connected && state.supabase.client) {
      const { error } = await state.supabase.client
        .from('staff_members')
        .upsert(staffObj);
      if (error) {
        throw new Error('បញ្ហាក្នុងការរក្សាទុកទៅកាន់ Supabase Cloud: ' + error.message);
      }
    }
    
    // 2. Update local state
    const index = state.staffList.findIndex(x => x.id === targetId);
    if (index !== -1) {
      state.staffList[index] = staffObj;
    } else {
      state.staffList.push(staffObj);
    }
    
    saveData();
    populateSchoolFilterDropdown();
    closeModal('staffFormModal');
    render();
    
    showToast(`☁️ បានបញ្ចូលទៅក្នុងប្រព័ន្ធរួមដោយជោគជ័យ៖ ${staffObj.name_kh}`, 'success');
  } catch (err) {
    console.error('Error saving staff:', err);
    alert(err.message || 'មានបញ្ហាក្នុងការរក្សាទុក!');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
    }
  }
}

// View Modal: Official Civil Servant Record Sheet
function openViewModal(id) {
  const item = state.staffList.find(x => x.id === id);
  if (!item) return;
  
  state.viewingId = id;
  
  const content = document.getElementById('viewModalContent');
  if (content) {
    content.innerHTML = `
      <div class="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white p-6 rounded-t-2xl border-b border-blue-800">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div class="flex items-center gap-2 mb-1.5">
              <span class="px-2.5 py-0.5 text-xs rounded-full font-bold bg-white/20 text-blue-100">
                ${item.staff_type}
              </span>
              <span class="text-xs text-blue-300 font-mono">ល.រ ទី ${item.id}</span>
            </div>
            <h2 class="text-2xl font-bold">${item.name_kh}</h2>
            <p class="text-sm text-blue-200 font-mono">${item.name_en || 'N/A'}</p>
          </div>
          <div class="text-left sm:text-right bg-blue-800/40 p-3 rounded-xl border border-blue-700/60">
            <span class="text-xs text-blue-200 block">ប្រាក់បៀវត្សមូលដ្ឋាន</span>
            <span class="text-xl font-bold font-mono text-amber-300">${formatNumber(item.base_salary)} ៛</span>
            <span class="text-[11px] text-blue-200 block mt-1">មុខងារ: <b class="text-white">${item.position || 'គ្រូបង្រៀន'}</b></span>
          </div>
        </div>
      </div>
      
      <div class="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar text-sm font-khmer">
        
        <!-- Section 1: ព័ត៌មានផ្ទាល់ខ្លួន និងទីកន្លែងកំណើត -->
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 class="text-xs font-bold text-blue-900 uppercase flex items-center gap-1.5">
            <svg class="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            ១. ព័ត៌មានផ្ទាល់ខ្លួន និងទីកន្លែងកំណើត
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span class="text-slate-500 block">អត្តលេខមន្ត្រី</span>
              <span class="font-mono font-bold text-slate-800 text-sm">${item.staff_id || '-'}</span>
            </div>
            <div>
              <span class="text-slate-500 block">ភេទ</span>
              <span class="font-medium ${item.gender === 'ស' ? 'text-pink-600' : 'text-blue-600'}">${item.gender_label}</span>
            </div>
            <div>
              <span class="text-slate-500 block">ថ្ងៃខែឆ្នាំកំណើត</span>
              <span class="font-mono font-medium text-slate-800">${item.dob || '<span class="text-slate-400">មិនបានបញ្ជាក់</span>'}</span>
            </div>
            <div>
              <span class="text-slate-500 block">លេខទូរសព្ទ</span>
              <span class="font-mono font-medium text-slate-800">${item.phone || '<span class="text-slate-400">គ្មាន</span>'}</span>
            </div>
          </div>
          <div class="pt-2 border-t border-slate-200/60 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span class="text-slate-500 block">កំណើត: ខេត្ត/រាជធានី</span>
              <span class="font-medium text-slate-700">${item.pob_province || '-'}</span>
            </div>
            <div>
              <span class="text-slate-500 block">ស្រុក/ខណ្ឌ</span>
              <span class="font-medium text-slate-700">${item.pob_district || '-'}</span>
            </div>
            <div>
              <span class="text-slate-500 block">ឃុំ/សង្កាត់</span>
              <span class="font-medium text-slate-700">${item.pob_commune || '-'}</span>
            </div>
            <div>
              <span class="text-slate-500 block">ភូមិ</span>
              <span class="font-medium text-slate-700">${item.pob_village || '-'}</span>
            </div>
          </div>
        </div>

        <!-- Section 2: ក្របខ័ណ្ឌ មុខងារ និងអង្គភាព -->
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 class="text-xs font-bold text-blue-900 uppercase flex items-center gap-1.5">
            <svg class="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            ២. ក្របខ័ណ្ឌ មុខងារ និងអង្គភាពបម្រើការ
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span class="text-slate-500 block">មុខងារ / តួនាទី</span>
              <span class="font-semibold text-slate-800">${item.position || 'គ្រូបង្រៀន'}</span>
            </div>
            <div>
              <span class="text-slate-500 block">សាលារៀន/អង្គភាព</span>
              <span class="font-medium text-slate-800">${item.school_name || '-'}</span>
            </div>
            <div>
              <span class="text-slate-500 block">លេខកូដសាលា / ឃុំ</span>
              <span class="font-mono text-slate-600">${item.school_code || '-'} (${item.commune_name})</span>
            </div>
            <div>
              <span class="text-slate-500 block">ថ្ងៃចូលបម្រើការងារ</span>
              <span class="font-mono text-slate-700">${item.join_date || '-'}</span>
            </div>
            <div>
              <span class="text-slate-500 block">ថ្ងៃតាំងស៊ប់ក្នុងក្របខ័ណ្ឌ</span>
              <span class="font-mono text-slate-700">${item.tenure_date || '-'}</span>
            </div>
            <div>
              <span class="text-slate-500 block">ឋានន្តរស័ក្តិ/កាំប្រាក់</span>
              <span class="font-mono font-bold text-indigo-900">${item.rank_type || '-'} ${item.rank_date ? `(${item.rank_date})` : ''}</span>
            </div>
          </div>
        </div>

        <!-- Section 3: ប្រាក់បៀវត្ស ប្រាក់បំណាច់ និងប្រាក់វិភាជន៍ -->
        <div class="bg-blue-50/40 p-4 rounded-xl border border-blue-200/60 space-y-3">
          <h4 class="text-xs font-bold text-blue-900 uppercase flex items-center gap-1.5">
            <svg class="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            ៣. បៀវត្ស បំណាច់មុខងារ និងប្រាក់វិភាជន៍គ្រួសារ
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span class="text-slate-500 block">ប្រាក់បៀវត្សមូលដ្ឋាន</span>
              <span class="font-mono font-bold text-blue-950 text-sm">${formatNumber(item.base_salary)} ៛</span>
            </div>
            <div>
              <span class="text-slate-500 block">ប្រាក់បំណាច់មុខងារ</span>
              <span class="font-mono font-medium text-slate-800">${formatNumber(item.position_allowance)} ៛</span>
            </div>
            <div>
              <span class="text-slate-500 block">ប្រាក់វិភាជន៍កូន</span>
              <span class="font-mono text-slate-700">${formatNumber(item.family_children)} ៛</span>
            </div>
            <div>
              <span class="text-slate-500 block">ប្រាក់វិភាជន៍សហព័ទ្ធ</span>
              <span class="font-mono text-slate-700">${formatNumber(item.family_spouse)} ៛</span>
            </div>
          </div>
        </div>

        <!-- Section 4: អត្តសញ្ញាណប័ណ្ណ និងធនាគារ -->
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
          <h4 class="font-bold text-slate-800 uppercase">៤. អត្តសញ្ញាណប័ណ្ណ និងគណនីធនាគារ</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span class="text-slate-500 block">លេខអត្តសញ្ញាណប័ណ្ណខ្មែរ</span>
              <span class="font-mono font-bold text-slate-800">${item.national_id || '-'}</span>
            </div>
            <div>
              <span class="text-slate-500 block">សុពលភាពចាប់ពី</span>
              <span class="font-mono text-slate-700">${item.id_issue_date || '-'} ដល់ ${item.id_expiry_date || '-'}</span>
            </div>
            <div>
              <span class="text-slate-500 block">គណនីធនាគារ</span>
              <span class="font-mono font-bold text-blue-900">${item.account_number || '<span class="text-red-400 font-normal">គ្មាន</span>'}</span>
            </div>
          </div>
        </div>

        ${item.note ? `
          <div class="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg flex items-start gap-2">
            <svg class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div><span class="font-bold">សម្គាល់ / ផ្សេងៗ៖</span> ${item.note}</div>
          </div>
        ` : ''}

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button onclick="closeModal('viewStaffModal')" class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium text-xs">បិទ</button>
          <button onclick="closeModal('viewStaffModal'); openEditModal(${item.id});" class="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 font-medium text-xs flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            កែប្រែព័ត៌មានលម្អិត
          </button>
        </div>
      </div>
    `;
    openModal('viewStaffModal');
  }
}

// Delete confirmation
function confirmDeleteStaff(id) {
  const item = state.staffList.find(x => x.id === id);
  if (!item) return;
  
  state.deleteTargetId = id;
  const msg = document.getElementById('deleteModalMsg');
  if (msg) {
    msg.textContent = `តើលោកអ្នកពិតជាចង់លុបឈ្មោះ "${item.name_kh}" (អត្តលេខ៖ ${item.staff_id || 'គ្មាន'}) ចេញពីប្រព័ន្ធមែនទេ?`;
  }
  openModal('deleteConfirmModal');
}

async function executeDelete() {
  if (state.deleteTargetId === null) return;
  
  const id = state.deleteTargetId;
  const item = state.staffList.find(x => x.id === id);
  const name = item ? item.name_kh : '';
  
  // 1. Delete from Supabase Central Database
  if (state.supabase.connected && state.supabase.client) {
    const { error } = await state.supabase.client
      .from('staff_members')
      .delete()
      .eq('id', id);
    if (error) {
      alert(`មិនអាចលុបចេញពីប្រព័ន្ធរួមបានទេ៖ ${error.message}`);
      return;
    }
  }

  // 2. Delete from local state
  state.staffList = state.staffList.filter(x => x.id !== id);
  saveData();
  closeModal('deleteConfirmModal');
  state.deleteTargetId = null;
  
  showToast(`🗑️ បានលុបឈ្មោះ ${name} ចេញពីប្រព័ន្ធរួមដោយជោគជ័យ!`, 'info');
  render();
}

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.remove('hidden');
    m.classList.add('flex');
  }
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.add('hidden');
    m.classList.remove('flex');
  }
}

// Export to CSV / Excel matching the user's exact multi-column official format
function exportToCSV() {
  const filtered = getFilteredStaff();
  if (filtered.length === 0) {
    alert('គ្មានទិន្នន័យសម្រាប់ទាញយកទេ!');
    return;
  }

  // If SheetJS is loaded, export directly as a styled native .xlsx workbook
  if (typeof XLSX !== 'undefined') {
    const wb = XLSX.utils.book_new();
    const rows = [
      [
        'ល.រ',
        'អត្តលេខមន្ត្រីរាជការ',
        'ឈ្មោះមន្ត្រីរាជការ(ខ្មែរ)',
        'ឈ្មោះមន្ត្រីរាជការ(ឡាតាំង)',
        'ភេទ',
        'ថ្ងៃខែឆ្នាំកំណើត',
        'ទីកន្លែងកំណើត-រាជធានី/ខេត្ត',
        'ទីកន្លែងកំណើត-ក្រុង/ស្រុក/ខណ្ឌ',
        'ទីកន្លែងកំណើត-ឃុំ/សង្កាត់',
        'ទីកន្លែងកំណើត-ភូមិ',
        'ថ្ងៃខែឆ្នាំចូលបម្រើការជាមន្ត្រីរាជការ',
        'ថ្ងៃខែឆ្នាំតាំងស៊ប់ក្នុងក្របខ័ណ្ឌ',
        'ប្រាក់បៀវត្សមូលដ្ឋាន',
        'ប្រាក់បំណាច់មុខងារ',
        'មុខងារ',
        'ប្រាក់វិភាជន៍គ្រួសារ-កូន',
        'ប្រាក់វិភាជន៍គ្រួសារ-សហព័ទ្ធ',
        'ឋានន្តរស័ក្តិ-តាមប្រភេទ',
        'ឋានន្តរស័ក្តិ-កាលបរិច្ឆេទ',
        'អត្តសញ្ញាប័ណ្ណ-លេខ',
        'អត្តសញ្ញាប័ណ្ណ-សុពលភាពចាប់ពី',
        'អត្តសញ្ញាប័ណ្ណ-ផុតសុពលភាពថ្ងៃ',
        'គណនីធនាគារ',
        'លេខទូរសព្ទ',
        'សាលារៀន/អង្គភាព',
        'លេខកូដសាលា',
        'ឃុំ/ភូមិសាស្ត្រ',
        'ផ្សេងៗ'
      ]
    ];

    filtered.forEach((item, idx) => {
      rows.push([
        idx + 1,
        item.staff_id || '',
        item.name_kh || '',
        item.name_en || '',
        item.gender_label || (item.gender === 'ស' ? 'ស្រី' : 'ប្រុស'),
        item.dob || '',
        item.pob_province || '',
        item.pob_district || '',
        item.pob_commune || '',
        item.pob_village || '',
        item.join_date || '',
        item.tenure_date || '',
        item.base_salary || 0,
        item.position_allowance || 0,
        item.position || '',
        item.family_children || 0,
        item.family_spouse || 0,
        item.rank_type || '',
        item.rank_date || '',
        item.national_id || '',
        item.id_issue_date || '',
        item.id_expiry_date || '',
        item.account_number || '',
        item.phone || '',
        item.school_name || '',
        item.school_code || '',
        item.commune_name || '',
        item.note || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'ទិន្នន័យ');
    XLSX.writeFile(wb, `បញ្ជីបុគ្គលិកអប់រំ_តាលោសែនជ័យ_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast(`បានទាញយកទិន្នន័យ ${filtered.length} នាក់ ជាឯកសារ Excel (.xlsx) ដោយជោគជ័យ!`, 'success');
    return;
  }
  
  let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel in Windows
  
  const headers = [
    'ល.រ',
    'អត្តលេខមន្ត្រីរាជការ',
    'ឈ្មោះមន្ត្រីរាជការ(ខ្មែរ)',
    'ឈ្មោះមន្ត្រីរាជការ(ឡាតាំង)',
    'ភេទ',
    'ថ្ងៃខែឆ្នាំកំណើត',
    'ទីកន្លែងកំណើត-រាជធានី/ខេត្ត',
    'ទីកន្លែងកំណើត-ក្រុង/ស្រុក/ខណ្ឌ',
    'ទីកន្លែងកំណើត-ឃុំ/សង្កាត់',
    'ទីកន្លែងកំណើត-ភូមិ',
    'ថ្ងៃខែឆ្នាំចូលបម្រើការជាមន្ត្រីរាជការ',
    'ថ្ងៃខែឆ្នាំតាំងស៊ប់ក្នុងក្របខ័ណ្ឌ',
    'ប្រាក់បៀវត្សមូលដ្ឋាន',
    'ប្រាក់បំណាច់មុខងារ',
    'មុខងារ',
    'ប្រាក់វិភាជន៍គ្រួសារ-កូន',
    'ប្រាក់វិភាជន៍គ្រួសារ-សហព័ទ្ធ',
    'ឋានន្តរស័ក្តិ-តាមប្រភេទ',
    'ឋានន្តរស័ក្តិ-កាលបរិច្ឆេទ',
    'អត្តសញ្ញាប័ណ្ណ-លេខ',
    'អត្តសញ្ញាប័ណ្ណ-សុពលភាពចាប់ពី',
    'អត្តសញ្ញាប័ណ្ណ-ផុតសុពលភាពថ្ងៃ',
    'គណនីធនាគារ',
    'លេខទូរសព្ទ',
    'សាលារៀន/អង្គភាព',
    'លេខកូដសាលា',
    'ឃុំ/ភូមិសាស្ត្រ',
    'ផ្សេងៗ'
  ];
  
  csvContent += headers.map(h => `"${h}"`).join(',') + '\r\n';
  
  filtered.forEach((item, idx) => {
    const row = [
      idx + 1,
      item.staff_id || '',
      item.name_kh || '',
      item.name_en || '',
      item.gender_label || '',
      item.dob || '',
      item.pob_province || '',
      item.pob_district || '',
      item.pob_commune || '',
      item.pob_village || '',
      item.join_date || '',
      item.tenure_date || '',
      item.base_salary || 0,
      item.position_allowance || 0,
      item.position || '',
      item.family_children || 0,
      item.family_spouse || 0,
      item.rank_type || '',
      item.rank_date || '',
      item.national_id ? `="${item.national_id}"` : '',
      item.id_issue_date || '',
      item.id_expiry_date || '',
      item.account_number ? `="${item.account_number}"` : '',
      item.phone ? `="${item.phone}"` : '',
      item.school_name || '',
      item.school_code || '',
      item.commune_name || '',
      item.note || ''
    ];
    csvContent += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\r\n';
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `តារាងស្រង់ទិន្នន័យមន្ត្រីរាជការ_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('បានទាញយកឯកសារ CSV/Excel រួចរាល់!', 'success');
}

function triggerPrint() {
  window.print();
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-blue-600';
  
  toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm transition-all transform duration-300 translate-y-2 opacity-0 font-khmer`;
  toast.innerHTML = `
    <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });
  
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==============================================================================
// SUPABASE INTEGRATION & CLOUD SYNC MODULE
// ==============================================================================

function initSupabase() {
  try {
    let url = DEFAULT_SUPABASE_URL;
    let key = DEFAULT_SUPABASE_KEY;
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      const cfg = JSON.parse(raw);
      if (cfg.url && cfg.key) {
        url = cfg.url;
        key = cfg.key;
      }
    }
    state.supabase.url = url;
    state.supabase.key = key;
    setupSupabaseClient(url, key, false);
  } catch (err) {
    console.error('Error loading Supabase config:', err);
  }
}

async function setupSupabaseClient(url, key, isManualTest = false) {
  if (!window.supabase) {
    console.warn('Supabase JS library not loaded yet');
    return;
  }
  
  try {
    const client = window.supabase.createClient(url, key);
    state.supabase.client = client;
    
    // Query central database for all staff members directly on load
    const { data, count, error } = await client
      .from('staff_members')
      .select('*', { count: 'exact' })
      .order('id', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205' || (error.message && error.message.includes('Could not find the table'))) {
        state.supabase.connected = true;
        state.supabase.needsTable = true;
        updateSupabaseStatusUI(true, 'បានភ្ជាប់ (ត្រូវការ Run កូដ SQL)', 0);
        if (isManualTest) {
          showToast('បានភ្ជាប់ Supabase ជោគជ័យ! សូម Run កូដ SQL ដើម្បីបង្កើតតារាង', 'info');
        }
      } else {
        console.warn('Supabase connection warning:', error.message);
        state.supabase.connected = false;
        state.supabase.needsTable = false;
        updateSupabaseStatusUI(false, `បរាជ័យ៖ ${error.message}`, 0);
        if (isManualTest) {
          showToast(`មិនអាចភ្ជាប់ Supabase: ${error.message}`, 'error');
        }
      }
    } else {
      state.supabase.connected = true;
      state.supabase.needsTable = false;
      
      // Update local state with latest live data from Central Supabase
      if (data && data.length > 0) {
        state.staffList = data;
        saveData(); // cache in localStorage
        populateSchoolFilterDropdown();
        render();
      }
      
      updateSupabaseStatusUI(true, 'ប្រព័ន្ធរួមដំណើរការ (Cloud Live)', (data ? data.length : 0));
      if (isManualTest) {
        showToast(`បានភ្ជាប់ប្រព័ន្ធរួមជោគជ័យ! ទិន្នន័យ៖ ${data.length} នាក់`, 'success');
      }

      // Subscribe to Realtime Postgres Changes across all users
      subscribeToRealtimeChanges();
    }
  } catch (err) {
    state.supabase.connected = false;
    updateSupabaseStatusUI(false, err.message, 0);
  }
}

let realtimeChannel = null;
function subscribeToRealtimeChanges() {
  if (!state.supabase.client || !state.supabase.connected) return;
  if (realtimeChannel) return; // avoid duplicate listeners
  
  try {
    realtimeChannel = state.supabase.client
      .channel('public:staff_members_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_members' }, (payload) => {
        handleRealtimePayload(payload);
      })
      .subscribe((status) => {
        console.log('Supabase Realtime status:', status);
      });
  } catch (err) {
    console.warn('Could not subscribe to Realtime:', err);
  }
}

function handleRealtimePayload(payload) {
  const { eventType, new: newRecord, old: oldRecord } = payload;
  
  if (eventType === 'INSERT') {
    const exists = state.staffList.some(x => x.id === newRecord.id);
    if (!exists) {
      state.staffList.push(newRecord);
      state.staffList.sort((a, b) => a.id - b.id);
      saveData();
      populateSchoolFilterDropdown();
      render();
      showToast(`📥 មានបុគ្គលិកថ្មីត្រូវបានបញ្ចូលក្នុងប្រព័ន្ធរួម៖ ${newRecord.name_kh}`, 'info');
      updateSupabaseStatusUI(true, 'ប្រព័ន្ធរួមដំណើរការ (Cloud Live)', state.staffList.length);
    }
  } else if (eventType === 'UPDATE') {
    const index = state.staffList.findIndex(x => x.id === newRecord.id);
    if (index !== -1) {
      state.staffList[index] = newRecord;
      saveData();
      render();
      showToast(`🔄 ទិន្នន័យ "${newRecord.name_kh}" ត្រូវបានកែប្រែក្នុងប្រព័ន្ធរួម`, 'info');
    }
  } else if (eventType === 'DELETE') {
    const targetId = oldRecord ? oldRecord.id : null;
    if (targetId) {
      state.staffList = state.staffList.filter(x => x.id !== targetId);
      saveData();
      populateSchoolFilterDropdown();
      render();
      showToast('🗑️ ទិន្នន័យត្រូវបានលុបចេញពីប្រព័ន្ធរួម', 'info');
      updateSupabaseStatusUI(true, 'ប្រព័ន្ធរួមដំណើរការ (Cloud Live)', state.staffList.length);
    }
  }
}

function updateSupabaseStatusUI(connected, message, count) {
  const indHeader = document.getElementById('supabaseIndicator');
  const txtHeader = document.getElementById('supabaseStatusText');
  const btnHeader = document.getElementById('btnSupabaseStatus');
  
  const indModal = document.getElementById('supabaseModalIndicator');
  const txtModal = document.getElementById('supabaseModalStatusText');
  const cntModal = document.getElementById('supabaseRecordCountText');
  
  if (connected) {
    if (indHeader) indHeader.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
    if (txtHeader) txtHeader.textContent = 'Supabase: បានភ្ជាប់';
    if (btnHeader) btnHeader.className = 'px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition';
    
    if (indModal) indModal.className = 'w-3 h-3 rounded-full bg-emerald-500';
    if (txtModal) txtModal.textContent = `ស្ថានភាព៖ ${message}`;
    if (cntModal) cntModal.textContent = `លើ Cloud: ${formatNumber(count)} នាក់`;
  } else {
    if (indHeader) indHeader.className = 'w-2.5 h-2.5 rounded-full bg-amber-400';
    if (txtHeader) txtHeader.textContent = 'Supabase: រៀបចំ';
    if (btnHeader) btnHeader.className = 'px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition';
    
    if (indModal) indModal.className = 'w-3 h-3 rounded-full bg-amber-400';
    if (txtModal) txtModal.textContent = `ស្ថានភាព៖ ${message || 'មិនទាន់ភ្ជាប់'}`;
    if (cntModal) cntModal.textContent = 'មិនទាន់ភ្ជាប់';
  }
}

function openSupabaseModal() {
  const urlInput = document.getElementById('sbProjectUrl');
  const keyInput = document.getElementById('sbAnonKey');
  if (urlInput) urlInput.value = state.supabase.url || '';
  if (keyInput) keyInput.value = state.supabase.key || '';
  
  openModal('supabaseModal');
}

function saveAndConnectSupabase() {
  const url = (document.getElementById('sbProjectUrl').value || '').trim();
  const key = (document.getElementById('sbAnonKey').value || '').trim();
  
  if (!url || !key) {
    alert('សូមបញ្ចូល Supabase Project URL និង Anon Key');
    return;
  }
  
  state.supabase.url = url;
  state.supabase.key = key;
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url, key }));
  
  setupSupabaseClient(url, key, true);
}

function disconnectSupabase() {
  if (confirm('តើលោកអ្នកចង់ផ្តាច់ការតភ្ជាប់ពី Supabase មែនទេ? (ទិន្នន័យលើកុំព្យូទ័រនៅរក្សាដដែល)')) {
    state.supabase.url = '';
    state.supabase.key = '';
    state.supabase.client = null;
    state.supabase.connected = false;
    localStorage.removeItem(SUPABASE_CONFIG_KEY);
    
    const urlInput = document.getElementById('sbProjectUrl');
    const keyInput = document.getElementById('sbAnonKey');
    if (urlInput) urlInput.value = '';
    if (keyInput) keyInput.value = '';
    
    updateSupabaseStatusUI(false, 'មិនទាន់ភ្ជាប់', 0);
    showToast('បានផ្តាច់ការតភ្ជាប់ Supabase រួចរាល់!', 'info');
  }
}

// Push all local staff (213 records) to Supabase
async function syncAllToSupabase() {
  if (!state.supabase.client || !state.supabase.connected) {
    alert('សូមភ្ជាប់ទៅកាន់ Supabase ជាមុនសិន!');
    return;
  }
  
  if (state.supabase.needsTable) {
    alert('តារាង staff_members មិនទាន់ត្រូវបានបង្កើតលើ Supabase នៅឡើយទេ!\n\nសូមចុចប៊ូតុង "ចម្លងកូដ SQL បង្កើតតារាង" រួចយកទៅ Run ក្នុង Supabase Dashboard -> SQL Editor ជាមុនសិន។');
    return;
  }
  
  if (!confirm(`តើអ្នកពិតជាចង់បញ្ជូនទិន្នន័យបុគ្គលិកទាំងអស់ (${state.staffList.length} នាក់) ទៅកាន់ Supabase Cloud មែនទេ?`)) {
    return;
  }
  
  showToast('កំពុងបញ្ជូនទិន្នន័យទៅ Supabase...', 'info');
  
  try {
    const list = state.staffList.map(item => ({
      id: item.id,
      staff_id: item.staff_id || '',
      staff_type: item.staff_type || 'ក្របខណ្ឌ',
      name_kh: item.name_kh || '',
      name_en: item.name_en || '',
      gender: item.gender || 'ស',
      gender_label: item.gender_label || (item.gender === 'ស' ? 'ស្រី' : 'ប្រុស'),
      dob: item.dob || '',
      pob_province: item.pob_province || '',
      pob_district: item.pob_district || '',
      pob_commune: item.pob_commune || '',
      pob_village: item.pob_village || '',
      join_date: item.join_date || '',
      tenure_date: item.tenure_date || '',
      position: item.position || '',
      rank_type: item.rank_type || '',
      rank_date: item.rank_date || '',
      base_salary: Number(item.base_salary || 0),
      position_allowance: Number(item.position_allowance || 0),
      family_children: Number(item.family_children || 0),
      family_spouse: Number(item.family_spouse || 0),
      school_code: item.school_code || '',
      school_name: item.school_name || '',
      commune_code: item.commune_code || '',
      commune_name: item.commune_name || '',
      national_id: item.national_id || '',
      id_issue_date: item.id_issue_date || '',
      id_expiry_date: item.id_expiry_date || '',
      account_number: item.account_number || '',
      phone: item.phone || '',
      note: item.note || '',
      updated_at: new Date().toISOString()
    }));
    
    // Chunk upload 50 items at a time
    const chunkSize = 50;
    for (let i = 0; i < list.length; i += chunkSize) {
      const chunk = list.slice(i, i + chunkSize);
      const { error } = await state.supabase.client.from('staff_members').upsert(chunk);
      if (error) throw error;
    }
    
    showToast(`បានបញ្ជូនទិន្នន័យ ${list.length} នាក់ ទៅ Supabase ដោយជោគជ័យ!`, 'success');
    setupSupabaseClient(state.supabase.url, state.supabase.key, false);
  } catch (err) {
    console.error('Error syncing to Supabase:', err);
    alert(`បញ្ហាក្នុងការបញ្ជូនទៅ Supabase: ${err.message}\n\nសូមប្រាកដថាបាន Run កូដ SQL បង្កើតតារាងរួចហើយ។`);
  }
}

// Pull all staff from Supabase into local storage
async function pullAllFromSupabase() {
  if (!state.supabase.client || !state.supabase.connected) {
    alert('សូមភ្ជាប់ទៅកាន់ Supabase ជាមុនសិន!');
    return;
  }
  
  if (!confirm('ការទាញយកពី Supabase នឹងធ្វើបច្ចុប្បន្នភាពទិន្នន័យលើកម្មវិធីនេះ។ តើអ្នកចង់បន្តទេ?')) {
    return;
  }
  
  showToast('កំពុងទាញយកទិន្នន័យពី Supabase...', 'info');
  
  try {
    const { data, error } = await state.supabase.client
      .from('staff_members')
      .select('*')
      .order('id', { ascending: true });
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      state.staffList = data;
      saveData();
      populateSchoolFilterDropdown();
      render();
      showToast(`បានទាញយកទិន្នន័យ ${data.length} នាក់ ពី Supabase រួចរាល់!`, 'success');
      updateSupabaseStatusUI(true, 'បានភ្ជាប់ជោគជ័យ', data.length);
    } else {
      showToast('ពុំទាន់មានទិន្នន័យក្នុង Supabase នៅឡើយទេ!', 'info');
    }
  } catch (err) {
    console.error('Error pulling from Supabase:', err);
    alert(`បញ្ហាក្នុងការទាញយកពី Supabase: ${err.message}`);
  }
}

function copySupabaseSchemaSQL() {
  const sql = `-- ==============================================================================
-- SUPABASE DATABASE SCHEMA MIGRATION FOR TALOSENCHEY STAFF MANAGEMENT
-- ==============================================================================

create table if not exists public.staff_members (
  id bigint primary key,
  staff_id text,
  staff_type text not null default 'ក្របខណ្ឌ',
  name_kh text not null,
  name_en text,
  gender text not null default 'ស',
  gender_label text default 'ស្រី',
  dob text,
  pob_province text,
  pob_district text,
  pob_commune text,
  pob_village text,
  join_date text,
  tenure_date text,
  position text,
  rank_type text,
  rank_date text,
  base_salary numeric default 0,
  position_allowance numeric default 0,
  family_children numeric default 0,
  family_spouse numeric default 0,
  school_code text,
  school_name text,
  commune_code text,
  commune_name text,
  national_id text,
  id_issue_date text,
  id_expiry_date text,
  account_number text,
  phone text,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.staff_members enable row level security;

create policy "Allow public read access" on public.staff_members for select using (true);
create policy "Allow public insert access" on public.staff_members for insert with check (true);
create policy "Allow public update access" on public.staff_members for update using (true);
create policy "Allow public delete access" on public.staff_members for delete using (true);
`;

  navigator.clipboard.writeText(sql).then(() => {
    showToast('បានចម្លងកូដ SQL បង្កើតតារាង! អាច Paste ក្នុង SQL Editor បានភ្លាម', 'success');
  }).catch(() => {
    prompt('សូមចម្លងកូដ SQL ខាងក្រោម៖', sql);
  });
}

// Run on window load
window.addEventListener('DOMContentLoaded', initApp);


// ==========================================
// EXCEL IMPORT & TEMPLATE EXPORT SYSTEM
// ==========================================

// Global state for import
state.importParsedData = [];

// HTML Escaping Utility for safe UI rendering
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function switchImportTab(tab) {
  const fileBtn = document.getElementById('tabImportFileBtn');
  const pasteBtn = document.getElementById('tabImportPasteBtn');
  const filePanel = document.getElementById('importFileTabPanel');
  const pastePanel = document.getElementById('importPasteTabPanel');
  
  if (tab === 'file') {
    if (fileBtn) {
      fileBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold bg-teal-100 text-teal-800 transition flex items-center gap-1.5 shadow-2xs';
    }
    if (pasteBtn) {
      pasteBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1.5';
    }
    if (filePanel) filePanel.classList.remove('hidden');
    if (pastePanel) pastePanel.classList.add('hidden');
  } else {
    if (pasteBtn) {
      pasteBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold bg-teal-100 text-teal-800 transition flex items-center gap-1.5 shadow-2xs';
    }
    if (fileBtn) {
      fileBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1.5';
    }
    if (pastePanel) pastePanel.classList.remove('hidden');
    if (filePanel) filePanel.classList.add('hidden');
  }
}

function handlePastedTextImport() {
  const textarea = document.getElementById('importPastedText');
  if (!textarea || !textarea.value.trim()) {
    alert('សូមបិទភ្ជាប់ (Paste) ទិន្នន័យតារាង ឬ CSV ក្នុងប្រអប់ជាមុនសិន!');
    return;
  }
  
  if (typeof XLSX === 'undefined') {
    alert('មិនទាន់ផ្ទុកបណ្ណាល័យ XLSX បាននៅឡើយទេ!');
    return;
  }
  
  try {
    const text = textarea.value.trim();
    const workbook = XLSX.read(text, { type: 'string', raw: true });
    processWorkbook(workbook, 'pasted_text_data.csv');
  } catch (err) {
    console.error('Error parsing pasted text:', err);
    alert('កំហុសក្នុងការវិភាគអត្ថបទដែលបានបិទភ្ជាប់: ' + err.message);
  }
}

function openImportModal() {
  state.importParsedData = [];
  const fileInput = document.getElementById('excelFileInput');
  if (fileInput) fileInput.value = '';
  
  const textarea = document.getElementById('importPastedText');
  if (textarea) textarea.value = '';
  
  switchImportTab('file');
  
  const badge = document.getElementById('selectedFileNameBadge');
  if (badge) {
    badge.textContent = '';
    badge.classList.add('hidden');
  }
  
  const previewContainer = document.getElementById('importPreviewContainer');
  if (previewContainer) previewContainer.classList.add('hidden');
  
  const progressBarContainer = document.getElementById('importProgressBarContainer');
  if (progressBarContainer) progressBarContainer.classList.add('hidden');
  
  const btn = document.getElementById('btnExecuteImport');
  if (btn) {
    btn.disabled = true;
    const btnText = document.getElementById('btnExecuteImportText');
    if (btnText) btnText.textContent = 'បញ្ចូលទិន្នន័យទៅក្នុងប្រព័ន្ធរួម';
  }
  
  // Populate default school dropdown with available schools
  const schoolSelect = document.getElementById('importDefaultSchool');
  if (schoolSelect) {
    const schools = Array.from(new Set(state.staffList.map(s => s.school_name).filter(Boolean))).sort();
    schoolSelect.innerHTML = '<option value="">-- ប្រើតាមក្នុងឯកសារ Excel --</option>' +
      schools.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
  }
  
  openModal('importExcelModal');
}

function clearImportFile() {
  state.importParsedData = [];
  const fileInput = document.getElementById('excelFileInput');
  if (fileInput) fileInput.value = '';
  
  const badge = document.getElementById('selectedFileNameBadge');
  if (badge) {
    badge.textContent = '';
    badge.classList.add('hidden');
  }
  
  const previewContainer = document.getElementById('importPreviewContainer');
  if (previewContainer) previewContainer.classList.add('hidden');
  
  const btn = document.getElementById('btnExecuteImport');
  if (btn) btn.disabled = true;
}

// Normalize Khmer / Western digits & strings
function normalizeKhmerDigits(str) {
  if (str === null || str === undefined) return '';
  const s = String(str);
  const khDigits = '០១២៣៤៥៦៧៨៩';
  return s.replace(/[០-៩]/g, d => khDigits.indexOf(d));
}

// Convert date strings or Excel serial dates to standard YYYY-MM-DD
function parseExcelDate(val) {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val)) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'number') {
    // Excel serial date: 25569 = 1970-01-01
    if (val > 10000 && val < 60000) {
      const utcDays = Math.floor(val - 25569);
      const date = new Date(utcDays * 86400 * 1000);
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return String(val);
  }
  
  let s = normalizeKhmerDigits(String(val)).trim();
  // Check if DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    const y = dmy[3];
    return `${y}-${m}-${d}`;
  }
  // Check if YYYY/MM/DD or YYYY-MM-DD
  const ymd = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymd) {
    const y = ymd[1];
    const m = ymd[2].padStart(2, '0');
    const d = ymd[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return s;
}

// Handle selected file with intelligent UTF-8 encoding support
function handleExcelFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  
  const badge = document.getElementById('selectedFileNameBadge');
  if (badge) {
    badge.textContent = `ឯកសារ៖ ${file.name}`;
    badge.classList.remove('hidden');
  }
  
  if (typeof XLSX === 'undefined') {
    alert('មិនអាចដំណើរការបណ្ណាល័យ XLSX បានទេ។ សូមពិនិត្យមើលការតភ្ជាប់អ៊ីនធឺណិត ឬ Refresh ទំព័រនេះឡើងវិញ។');
    return;
  }
  
  const isCsv = file.name.toLowerCase().endsWith('.csv');
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let workbook;
      if (isCsv) {
        workbook = XLSX.read(e.target.result, { type: 'string', raw: true });
      } else {
        const data = new Uint8Array(e.target.result);
        workbook = XLSX.read(data, { type: 'array', cellDates: true });
      }
      processWorkbook(workbook, file.name);
    } catch (err) {
      console.error('Error parsing excel:', err);
      alert('កំហុសក្នុងការអានឯកសារ Excel: ' + err.message);
    }
  };
  if (isCsv) {
    reader.readAsText(file, 'utf-8');
  } else {
    reader.readAsArrayBuffer(file);
  }
}

// Process workbook sheets and map columns
function processWorkbook(workbook, fileName) {
  // Prefer sheet named 'ទិន្នន័យ' or 'តារាងបើកប្រាក់' or first sheet
  let targetSheetName = workbook.SheetNames[0];
  for (const name of workbook.SheetNames) {
    if (name.includes('ទិន្នន័យ') || name.includes('តារាងបើកប្រាក់') || name.includes('បុគ្គលិក') || name.includes('Staff')) {
      targetSheetName = name;
      break;
    }
  }
  
  const worksheet = workbook.Sheets[targetSheetName];
  if (!worksheet) {
    alert('រកមិនឃើញតារាងទិន្នន័យក្នុងឯកសារនេះទេ!');
    return;
  }
  
  // Convert sheet to 2D array of rows with raw: false to keep formatted phone & account strings
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
  if (!rawRows || rawRows.length === 0) {
    alert('ឯកសារ Excel គ្មានទិន្នន័យទេ!');
    return;
  }
  
  // Find header row by scanning first 10 rows
  let headerRowIndex = -1;
  for (let r = 0; r < Math.min(10, rawRows.length); r++) {
    const rowStr = rawRows[r].map(c => String(c || '').trim()).join(' ');
    if (rowStr.includes('ឈ្មោះ') || rowStr.includes('គោត្តនាម') || rowStr.includes('អត្តលេខ') || rowStr.includes('អក្សរខ្មែរ')) {
      headerRowIndex = r;
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    alert('មិនអាចកំណត់សម្គាល់ក្បាលតារាង (Header) នៃឯកសារនេះបានទេ! សូមពិនិត្យមើលថាតើមានជួរឈរ "ឈ្មោះ" ឬ "អត្តលេខ" ដែរឬទេ។');
    return;
  }
  
  const rowA = rawRows[headerRowIndex] || [];
  const rowB = (headerRowIndex + 1 < rawRows.length) ? rawRows[headerRowIndex + 1] : [];
  
  // Determine if it is a two-tier header
  const rowBStr = rowB.map(c => String(c || '').trim()).join(' ');
  const isTwoTier = ['ខេត្ត', 'ស្រុក', 'ឃុំ', 'ភូមិ', 'កូន', 'សហព័ទ្ធ', 'តាមប្រភេទ', 'អក្សរឡាតាំង', 'សុពលភាព', 'លេខអត្តសញ្ញាប័ណ្ណ'].some(k => rowBStr.includes(k));
  
  const dataStartRow = headerRowIndex + (isTwoTier ? 2 : 1);
  
  // Build combined header labels for each column index
  const colMappings = {};
  let lastParentHeader = '';
  
  const maxCols = Math.max(rowA.length, isTwoTier ? rowB.length : 0);
  for (let c = 0; c < maxCols; c++) {
    const parentVal = String(rowA[c] || '').trim();
    if (parentVal) lastParentHeader = parentVal;
    
    const subVal = isTwoTier ? String(rowB[c] || '').trim() : '';
    let combined = '';
    if (lastParentHeader && subVal) {
      combined = lastParentHeader + ' ' + subVal;
    } else {
      combined = subVal || parentVal;
    }
    
    // Map keywords to standard field names
    const combLow = combined.toLowerCase();
    
    if (colMappings.staff_id === undefined && (combLow.includes('អត្តលេខ') || combLow.includes('staff_id'))) {
      colMappings.staff_id = c;
    } else if (colMappings.name_kh === undefined && (
      combLow.includes('ឈ្មោះមន្ត្រីរាជការ(ខ្មែរ)') ||
      combLow.includes('ឈ្មោះ(ខ្មែរ)') ||
      combLow.includes('អក្សរខ្មែរ') ||
      (combLow.includes('ឈ្មោះ') && !combLow.includes('ឡាតាំង') && !combLow.includes('សាលា')) ||
      (combLow.includes('គោត្តនាម') && !combLow.includes('ឡាតាំង'))
    )) {
      colMappings.name_kh = c;
    } else if (colMappings.name_en === undefined && (
      combLow.includes('ឡាតាំង') ||
      combLow.includes('latin') ||
      combLow.includes('english')
    )) {
      colMappings.name_en = c;
    } else if (colMappings.gender === undefined && (combLow.includes('ភេទ') || combLow.includes('gender') || combLow.includes('sex'))) {
      colMappings.gender = c;
    } else if (colMappings.dob === undefined && (combLow.includes('កំណើត') || combLow.includes('dob') || combLow.includes('birth'))) {
      colMappings.dob = c;
    } else if (colMappings.pob_province === undefined && (combLow.includes('រាជធានី') || combLow.includes('ខេត្ត') || combLow.includes('province'))) {
      colMappings.pob_province = c;
    } else if (colMappings.pob_district === undefined && (combLow.includes('ស្រុក') || combLow.includes('ខណ្ឌ') || combLow.includes('ក្រុង') || combLow.includes('district'))) {
      colMappings.pob_district = c;
    } else if (colMappings.pob_commune === undefined && (combLow.includes('ឃុំ') || combLow.includes('សង្កាត់') || combLow.includes('commune'))) {
      colMappings.pob_commune = c;
    } else if (colMappings.pob_village === undefined && (combLow.includes('ភូមិ') && !combLow.includes('ភូមិសាស្ត្រ') || combLow.includes('village'))) {
      colMappings.pob_village = c;
    } else if (colMappings.join_date === undefined && (combLow.includes('ចូលបម្រើ') || combLow.includes('join_date'))) {
      colMappings.join_date = c;
    } else if (colMappings.tenure_date === undefined && (combLow.includes('តាំងស៊ប់') || combLow.includes('tenure'))) {
      colMappings.tenure_date = c;
    } else if (colMappings.base_salary === undefined && (combLow.includes('មូលដ្ឋាន') || combLow.includes('base_salary'))) {
      colMappings.base_salary = c;
    } else if (colMappings.position_allowance === undefined && (combLow.includes('បំណាច់') || combLow.includes('allowance'))) {
      colMappings.position_allowance = c;
    } else if (colMappings.position === undefined && (combLow.includes('មុខងារ') || combLow.includes('តួនាទី') || combLow.includes('position'))) {
      colMappings.position = c;
    } else if (colMappings.family_children === undefined && (combLow.includes('កូន') || combLow.includes('children'))) {
      colMappings.family_children = c;
    } else if (colMappings.family_spouse === undefined && (combLow.includes('សហព័ទ្ធ') || combLow.includes('spouse'))) {
      colMappings.family_spouse = c;
    } else if (colMappings.rank_type === undefined && (combLow.includes('តាមប្រភេទ') || combLow.includes('កាំប្រាក់') || combLow.includes('ឋានន្តរ'))) {
      colMappings.rank_type = c;
    } else if (colMappings.rank_date === undefined && (combLow.includes('កាលបរិច្ឆេទ') || combLow.includes('rank_date'))) {
      colMappings.rank_date = c;
    } else if (colMappings.national_id === undefined && (combLow.includes('អត្តសញ្ញាណ') || combLow.includes('អត្តសញ្ញាប័ណ្ណ') || combLow.includes('nid'))) {
      colMappings.national_id = c;
    } else if (colMappings.id_issue_date === undefined && (combLow.includes('សុពលភាពចាប់ពី') || combLow.includes('issue_date'))) {
      colMappings.id_issue_date = c;
    } else if (colMappings.id_expiry_date === undefined && (combLow.includes('ផុតសុពលភាព') || combLow.includes('ផុតកំណត់') || combLow.includes('expiry_date'))) {
      colMappings.id_expiry_date = c;
    } else if (colMappings.account_number === undefined && (combLow.includes('គណនី') || combLow.includes('bank') || combLow.includes('account'))) {
      colMappings.account_number = c;
    } else if (colMappings.phone === undefined && (combLow.includes('ទូរសព្ទ') || combLow.includes('ទូរស័ព្ទ') || combLow.includes('phone') || combLow.includes('tel'))) {
      colMappings.phone = c;
    } else if (colMappings.school_name === undefined && (combLow.includes('សាលា') || combLow.includes('អង្គភាព') || combLow.includes('school'))) {
      colMappings.school_name = c;
    } else if (colMappings.school_code === undefined && combLow.includes('កូដសាលា')) {
      colMappings.school_code = c;
    } else if (colMappings.commune_code === undefined && (combLow.includes('កូដភូមិសាស្ត្រ') || combLow.includes('ភូមិសាស្ត្រ'))) {
      colMappings.commune_code = c;
    }
  }
  
  if (colMappings.name_kh === undefined && colMappings.staff_id === undefined) {
    alert('មិនអាចរកឃើញជួរឈរ "ឈ្មោះ" ឬ "អត្តលេខ" ក្នុងតារាងទេ! សូមពិនិត្យមើលក្បាលតារាង។');
    return;
  }
  
  // Parse rows
  const parsedRecords = [];
  const defaultStaffType = document.getElementById('importDefaultStaffType').value || 'មន្ត្រីរាជការ';
  const defaultSchool = document.getElementById('importDefaultSchool').value || '';
  
  for (let r = dataStartRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;
    
    // Check if row contains metadata / option tables below data
    const rowStr = row.map(c => String(c || '').trim()).join(' ');
    if (rowStr.includes('Position benefit') || rowStr.includes('Framework Options') || rowStr.includes('Position Benefit Options')) {
      break;
    }
    
    // Check if empty row
    const rowContent = row.filter(x => x !== null && x !== undefined && String(x).trim() !== '').length;
    if (rowContent === 0) continue;
    
    // Helper getter
    const getVal = (colIdx) => {
      if (colIdx === undefined || colIdx >= row.length) return '';
      const v = row[colIdx];
      return v !== null && v !== undefined ? String(v).trim() : '';
    };
    
    const nameKh = getVal(colMappings.name_kh);
    const staffIdRaw = getVal(colMappings.staff_id);
    const nameEn = getVal(colMappings.name_en);
    
    // Skip if row has no name and no staff_id
    if (!nameKh && !staffIdRaw && !nameEn) continue;
    // Skip if name is purely numbers (e.g. '2.1') or options
    if (/^[\d.,\s]+$/.test(nameKh) && !staffIdRaw) continue;
    if (nameKh.includes('Option') || nameKh.includes('Benefit') || nameKh.includes('version')) continue;
    
    // Clean gender
    let genderVal = getVal(colMappings.gender);
    let gender = 'ប';
    let genderLabel = 'ប្រុស';
    if (genderVal) {
      const gNorm = genderVal.toLowerCase();
      if (gNorm === 'ស' || gNorm === 'ស្រី' || gNorm === 'f' || gNorm === 'female') {
        gender = 'ស';
        genderLabel = 'ស្រី';
      }
    }
    
    // Clean numbers
    const cleanNum = (str) => {
      if (!str) return 0;
      const cleaned = normalizeKhmerDigits(str).replace(/[^\d.-]/g, '');
      const n = parseFloat(cleaned);
      return isNaN(n) ? 0 : n;
    };
    
    // Clean dates
    const dob = parseExcelDate(colMappings.dob !== undefined ? row[colMappings.dob] : '');
    const joinDate = parseExcelDate(colMappings.join_date !== undefined ? row[colMappings.join_date] : '');
    const tenureDate = parseExcelDate(colMappings.tenure_date !== undefined ? row[colMappings.tenure_date] : '');
    const rankDate = parseExcelDate(colMappings.rank_date !== undefined ? row[colMappings.rank_date] : '');
    const idIssueDate = parseExcelDate(colMappings.id_issue_date !== undefined ? row[colMappings.id_issue_date] : '');
    const idExpiryDate = parseExcelDate(colMappings.id_expiry_date !== undefined ? row[colMappings.id_expiry_date] : '');
    
    // Clean position & rank
    const position = getVal(colMappings.position);
    let rankType = getVal(colMappings.rank_type);
    
    // Clean base salary & allowance
    let baseSalary = cleanNum(getVal(colMappings.base_salary));
    let posAllowance = cleanNum(getVal(colMappings.position_allowance));
    
    // Auto-calculate base salary if rank_type provided and salary is 0
    if (baseSalary === 0 && rankType && SALARY_SCALE_RATES[rankType]) {
      baseSalary = SALARY_SCALE_RATES[rankType];
    }
    // Auto-calculate position allowance if position provided and allowance is 0
    if (posAllowance === 0 && position && POSITION_ALLOWANCE_RATES[position]) {
      posAllowance = POSITION_ALLOWANCE_RATES[position];
    }
    
    // School name
    let schoolName = getVal(colMappings.school_name) || defaultSchool;
    
    // Record object
    const record = {
      staff_id: normalizeKhmerDigits(staffIdRaw),
      staff_type: defaultStaffType,
      name_kh: nameKh,
      name_en: nameEn,
      gender: gender,
      gender_label: genderLabel,
      dob: dob,
      pob_province: getVal(colMappings.pob_province),
      pob_district: getVal(colMappings.pob_district),
      pob_commune: getVal(colMappings.pob_commune),
      pob_village: getVal(colMappings.pob_village),
      join_date: joinDate,
      tenure_date: tenureDate,
      base_salary: baseSalary,
      position_allowance: posAllowance,
      position: position,
      family_children: cleanNum(getVal(colMappings.family_children)),
      family_spouse: cleanNum(getVal(colMappings.family_spouse)),
      rank_type: rankType,
      rank_date: rankDate,
      school_code: getVal(colMappings.school_code),
      school_name: schoolName,
      commune_code: getVal(colMappings.commune_code),
      commune_name: '',
      national_id: normalizeKhmerDigits(getVal(colMappings.national_id)),
      id_issue_date: idIssueDate,
      id_expiry_date: idExpiryDate,
      account_number: (() => {
        let acc = normalizeKhmerDigits(getVal(colMappings.account_number));
        if (acc && acc.length === 13 && acc.startsWith('400')) acc = '0' + acc;
        return acc;
      })(),
      phone: (() => {
        let p = normalizeKhmerDigits(getVal(colMappings.phone));
        if (p && /^[1-9]\d{7,8}$/.test(p)) p = '0' + p;
        return p;
      })(),
      note: ''
    };
    
    parsedRecords.push(record);
  }
  
  if (parsedRecords.length === 0) {
    alert('មិនមានទិន្នន័យបុគ្គលិកត្រឹមត្រូវក្នុងឯកសារនេះទេ!');
    return;
  }
  
  state.importParsedData = parsedRecords;
  renderExcelPreview(parsedRecords, colMappings);
}

// Render Preview Table
function renderExcelPreview(records, colMappings) {
  const container = document.getElementById('importPreviewContainer');
  const countBadge = document.getElementById('previewCountBadge');
  const infoText = document.getElementById('previewColumnsInfo');
  const tbody = document.getElementById('previewTableBody');
  const btn = document.getElementById('btnExecuteImport');
  const btnText = document.getElementById('btnExecuteImportText');
  
  if (!container || !tbody) return;
  
  container.classList.remove('hidden');
  countBadge.textContent = `${records.length} នាក់`;
  
  const mappedColsCount = Object.keys(colMappings).length;
  infoText.textContent = `បានផ្គូផ្គងស្វ័យប្រវត្តិចំនួន ${mappedColsCount} ជួរឈរ`;
  
  tbody.innerHTML = records.slice(0, 50).map((r, i) => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="p-2 text-center text-slate-400 font-mono text-[11px]">${i + 1}</td>
      <td class="p-2 font-mono font-medium text-blue-700">${escapeHtml(r.staff_id || '-')}</td>
      <td class="p-2 font-bold text-slate-800">${escapeHtml(r.name_kh || '-')}</td>
      <td class="p-2 text-slate-600">${escapeHtml(r.name_en || '-')}</td>
      <td class="p-2 text-center">
        <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold ${r.gender === 'ស' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}">
          ${r.gender_label}
        </span>
      </td>
      <td class="p-2 font-mono text-slate-600">${escapeHtml(r.dob || '-')}</td>
      <td class="p-2 text-slate-700">${escapeHtml(r.position || '-')}</td>
      <td class="p-2 font-mono text-slate-700">${escapeHtml(r.rank_type || '-')}</td>
      <td class="p-2 text-slate-600">${escapeHtml(r.school_name || '-')}</td>
    </tr>
  `).join('');
  
  if (records.length > 50) {
    tbody.innerHTML += `
      <tr class="bg-slate-50 text-center text-slate-500 font-medium italic text-xs">
        <td colspan="9" class="p-2.5">... និងនៅសល់ចំនួន ${records.length - 50} នាក់ទៀត ...</td>
      </tr>
    `;
  }
  
  if (btn) {
    btn.disabled = false;
    if (btnText) btnText.textContent = `📥 បញ្ចូលទិន្នន័យទាំងអស់ (${records.length} នាក់) ទៅក្នុងប្រព័ន្ធរួម`;
  }
}

// Execute Import and Batch Save to Supabase + Local State
async function executeExcelImport() {
  if (!state.importParsedData || state.importParsedData.length === 0) {
    alert('គ្មានទិន្នន័យសម្រាប់បញ្ចូលទេ!');
    return;
  }
  
  const records = state.importParsedData;
  const mode = document.getElementById('importMode').value || 'upsert';
  const defaultSchool = document.getElementById('importDefaultSchool').value;
  const defaultStaffType = document.getElementById('importDefaultStaffType').value;
  
  const btn = document.getElementById('btnExecuteImport');
  const btnText = document.getElementById('btnExecuteImportText');
  const progressContainer = document.getElementById('importProgressBarContainer');
  const progressBar = document.getElementById('importProgressBar');
  const progressStatus = document.getElementById('importProgressStatusText');
  const progressPercent = document.getElementById('importProgressPercentText');
  
  if (btn) btn.disabled = true;
  if (progressContainer) progressContainer.classList.remove('hidden');
  
  try {
    // 1. Determine next base ID from Supabase if connected
    let nextId = 1;
    if (state.supabase.connected && state.supabase.client) {
      try {
        const { data: maxRows } = await state.supabase.client
          .from('staff_members')
          .select('id')
          .order('id', { ascending: false })
          .limit(1);
        if (maxRows && maxRows.length > 0 && maxRows[0].id) {
          nextId = Number(maxRows[0].id) + 1;
        }
      } catch (e) {
        console.warn('Could not query max id from Supabase:', e);
      }
    }
    if (nextId === 1 && state.staffList.length > 0) {
      nextId = Math.max(...state.staffList.map(x => x.id || 0)) + 1;
    }
    
    // 2. Prepare items with unique IDs and match with existing
    const preparedItems = [];
    const nowIso = new Date().toISOString();
    
    records.forEach(rec => {
      // Overwrite default school or staff_type if selected
      if (defaultSchool && !rec.school_name) {
        rec.school_name = defaultSchool;
      }
      if (defaultStaffType && !rec.staff_type) {
        rec.staff_type = defaultStaffType;
      }
      
      let matched = null;
      if (mode === 'upsert') {
        // Try match by staff_id
        if (rec.staff_id) {
          matched = state.staffList.find(s => s.staff_id && s.staff_id === rec.staff_id);
        }
        // Try match by name_kh if not matched
        if (!matched && rec.name_kh) {
          matched = state.staffList.find(s => s.name_kh === rec.name_kh && (!rec.school_name || s.school_name === rec.school_name));
        }
      }
      
      const itemToSave = {
        id: matched ? matched.id : (nextId++),
        staff_id: rec.staff_id || (matched ? matched.staff_id : ''),
        staff_type: rec.staff_type || (matched ? matched.staff_type : 'មន្ត្រីរាជការ'),
        name_kh: rec.name_kh || (matched ? matched.name_kh : ''),
        name_en: rec.name_en || (matched ? matched.name_en : ''),
        gender: rec.gender || (matched ? matched.gender : 'ប'),
        gender_label: rec.gender_label || (matched ? matched.gender_label : 'ប្រុស'),
        dob: rec.dob || (matched ? matched.dob : ''),
        pob_province: rec.pob_province || (matched ? matched.pob_province : ''),
        pob_district: rec.pob_district || (matched ? matched.pob_district : ''),
        pob_commune: rec.pob_commune || (matched ? matched.pob_commune : ''),
        pob_village: rec.pob_village || (matched ? matched.pob_village : ''),
        join_date: rec.join_date || (matched ? matched.join_date : ''),
        tenure_date: rec.tenure_date || (matched ? matched.tenure_date : ''),
        base_salary: rec.base_salary !== undefined ? rec.base_salary : (matched ? matched.base_salary : 0),
        position_allowance: rec.position_allowance !== undefined ? rec.position_allowance : (matched ? matched.position_allowance : 0),
        position: rec.position || (matched ? matched.position : ''),
        family_children: rec.family_children !== undefined ? rec.family_children : (matched ? matched.family_children : 0),
        family_spouse: rec.family_spouse !== undefined ? rec.family_spouse : (matched ? matched.family_spouse : 0),
        rank_type: rec.rank_type || (matched ? matched.rank_type : ''),
        rank_date: rec.rank_date || (matched ? matched.rank_date : ''),
        school_code: rec.school_code || (matched ? matched.school_code : ''),
        school_name: rec.school_name || (matched ? matched.school_name : ''),
        commune_code: rec.commune_code || (matched ? matched.commune_code : ''),
        commune_name: rec.commune_name || (matched ? matched.commune_name : ''),
        national_id: rec.national_id || (matched ? matched.national_id : ''),
        id_issue_date: rec.id_issue_date || (matched ? matched.id_issue_date : ''),
        id_expiry_date: rec.id_expiry_date || (matched ? matched.id_expiry_date : ''),
        account_number: rec.account_number || (matched ? matched.account_number : ''),
        phone: rec.phone || (matched ? matched.phone : ''),
        note: rec.note || (matched ? matched.note : ''),
        updated_at: nowIso
      };
      
      preparedItems.push(itemToSave);
    });
    
    // 3. Batch upload to Supabase if connected
    if (state.supabase.connected && state.supabase.client) {
      const chunkSize = 50;
      for (let i = 0; i < preparedItems.length; i += chunkSize) {
        const chunk = preparedItems.slice(i, i + chunkSize);
        const percent = Math.round(((i + chunk.length) / preparedItems.length) * 100);
        
        if (progressStatus) progressStatus.textContent = `កំពុងបញ្ជូនទៅ Supabase Cloud: ${i + chunk.length} / ${preparedItems.length}...`;
        if (progressPercent) progressPercent.textContent = `${percent}%`;
        if (progressBar) progressBar.style.width = `${percent}%`;
        
        const { error } = await state.supabase.client.from('staff_members').upsert(chunk);
        if (error) {
          console.error('Supabase batch upsert error:', error);
          throw error;
        }
      }
    }
    
    // 4. Update local state
    preparedItems.forEach(item => {
      const existingIdx = state.staffList.findIndex(s => s.id === item.id);
      if (existingIdx !== -1) {
        state.staffList[existingIdx] = item;
      } else {
        state.staffList.push(item);
      }
    });
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.staffList));
    } catch (storeErr) {
      console.warn('LocalStorage save failed:', storeErr);
    }
    
    // Refresh UI
    populateSchoolFilterDropdown();
    render();
    if (state.supabase.connected) {
      updateSupabaseStatusUI(true, 'ប្រព័ន្ធរួម: Cloud Live', state.staffList.length);
    }
    
    // Close modal and show success
    closeModal('importExcelModal');
    showToast(`🎉 បាននាំចូលទិន្នន័យចំនួន ${preparedItems.length} នាក់ ទៅក្នុងប្រព័ន្ធរួមដោយជោគជ័យ!`, 'success');
    
  } catch (err) {
    console.error('Error during import execution:', err);
    alert(`បញ្ហាក្នុងការបញ្ចូលទិន្នន័យ៖ ${err.message}`);
    if (btn) btn.disabled = false;
  } finally {
    if (progressContainer) progressContainer.classList.add('hidden');
  }
}

// Download Official Blank Excel Template (.xlsx) matching the 23 standard columns
function downloadSampleExcelTemplate() {
  if (typeof XLSX === 'undefined') {
    alert('មិនទាន់ផ្ទុកបណ្ណាល័យ XLSX បាននៅឡើយទេ។ សូមពិនិត្យមើលការតភ្ជាប់អ៊ីនធឺណិត។');
    return;
  }
  
  const wb = XLSX.utils.book_new();
  
  const headerRow1 = [
    'ល.រ',
    'អត្តលេខមន្ត្រីរាជការ',
    'ឈ្មោះមន្ត្រីរាជការ(ខ្មែរ)',
    'ឈ្មោះមន្ត្រីរាជការ(ឡាតាំង)',
    'ភេទ',
    'ថ្ងៃខែឆ្នាំកំណើត',
    'ទីកន្លែងកំណើត',
    '',
    '',
    '',
    'ថ្ងៃខែឆ្នាំចូលបម្រើការជាមន្ត្រីរាជការ',
    'ថ្ងៃខែឆ្នាំតាំងស៊ប់ក្នុងក្របខ័ណ្ឌ',
    'ប្រាក់បៀវត្សមូលដ្ឋាន',
    'ប្រាក់បំណាច់មុខងារ',
    'មុខងារ',
    'ប្រាក់វិភាជន៍គ្រួសារ',
    '',
    'ឋានន្តរស័ក្តិ និងថ្នាក់ដំឡើងចុងក្រោយ',
    '',
    'អត្តសញ្ញាប័ណ្ណសញ្ញជាតិខ្មែរ',
    '',
    '',
    'គណនីធនាគារ',
    'លេខទូរសព្ទ',
    'សាលារៀន/អង្គភាព'
  ];
  
  const headerRow2 = [
    '',
    '',
    '',
    '',
    '',
    '',
    'រាជធានី/ខេត្ត',
    'ក្រុង/ស្រុក/ខណ្ឌ',
    'ឃុំ/សង្កាត់',
    'ភូមិ',
    '',
    '',
    '',
    '',
    '',
    'កូន',
    'សហព័ទ្ធ',
    'តាមប្រភេទ',
    'កាលបរិច្ឆេទ',
    'លេខអត្តសញ្ញាប័ណ្ណ',
    'សុពលភាពចាប់ពី',
    'ផុតសុពលភាពថ្ងៃ',
    '',
    '',
    ''
  ];
  
  const sampleRow1 = [
    1,
    '2001500001',
    'សុខ សំបូរ',
    'SOK SAMBOR',
    'ប្រុស',
    '1985-05-15',
    'ពោធិ៍សាត់',
    'តាលោសែនជ័យ',
    'តាលោ',
    'ព្រៃកន្ទួត',
    '2010-10-01',
    '2012-10-01',
    1165090,
    800000,
    'គ្រូបង្រៀនកម្រិតបឋម',
    1,
    1,
    'ក២.១',
    '2024-04-13',
    '010203040',
    '2015-01-10',
    '2025-01-10',
    '34580160899715',
    '012345678',
    'បឋមសិក្សាតាលោ'
  ];
  
  const sampleRow2 = [
    2,
    '2001500002',
    'ចាន់ ធីតា',
    'CHAN THIDA',
    'ស្រី',
    '1990-08-20',
    'ពោធិ៍សាត់',
    'តាលោសែនជ័យ',
    'ផ្ទះរុង',
    'ទួលទទឹង',
    '2014-11-01',
    '2016-11-01',
    1078300,
    900000,
    'នាយកសាលាបឋមសិក្សា',
    2,
    0,
    'ក២.៣',
    '2023-05-01',
    '010203041',
    '2016-02-15',
    '2026-02-15',
    '34580160899716',
    '098765432',
    'បឋមសិក្សាផ្ទះរុង'
  ];
  
  const sheetData = [headerRow1, headerRow2, sampleRow1, sampleRow2];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  
  // Merged headers configuration
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },   // ល.រ
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },   // អត្តលេខ
    { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },   // ឈ្មោះខ្មែរ
    { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },   // ឈ្មោះឡាតាំង
    { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } },   // ភេទ
    { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } },   // ថ្ងៃកំណើត
    { s: { r: 0, c: 6 }, e: { r: 0, c: 9 } },   // ទីកន្លែងកំណើត
    { s: { r: 0, c: 10 }, e: { r: 1, c: 10 } }, // ចូលបម្រើ
    { s: { r: 0, c: 11 }, e: { r: 1, c: 11 } }, // តាំងស៊ប់
    { s: { r: 0, c: 12 }, e: { r: 1, c: 12 } }, // មូលដ្ឋាន
    { s: { r: 0, c: 13 }, e: { r: 1, c: 13 } }, // បំណាច់
    { s: { r: 0, c: 14 }, e: { r: 1, c: 14 } }, // មុខងារ
    { s: { r: 0, c: 15 }, e: { r: 0, c: 16 } }, // វិភាជន៍
    { s: { r: 0, c: 17 }, e: { r: 0, c: 18 } }, // ឋានន្តរ
    { s: { r: 0, c: 19 }, e: { r: 0, c: 21 } }, // អត្តសញ្ញាប័ណ្ណ
    { s: { r: 0, c: 22 }, e: { r: 1, c: 22 } }, // គណនី
    { s: { r: 0, c: 23 }, e: { r: 1, c: 23 } }, // ទូរសព្ទ
    { s: { r: 0, c: 24 }, e: { r: 1, c: 24 } }  // សាលារៀន
  ];
  
  // Set nice column widths
  ws['!cols'] = [
    { wch: 6 },  // ល.រ
    { wch: 15 }, // អត្តលេខ
    { wch: 18 }, // ឈ្មោះខ្មែរ
    { wch: 18 }, // ឈ្មោះឡាតាំង
    { wch: 8 },  // ភេទ
    { wch: 14 }, // ថ្ងៃកំណើត
    { wch: 16 }, // ខេត្ត
    { wch: 16 }, // ស្រុក
    { wch: 16 }, // ឃុំ
    { wch: 16 }, // ភូមិ
    { wch: 14 }, // ចូលបម្រើ
    { wch: 14 }, // តាំងស៊ប់
    { wch: 14 }, // មូលដ្ឋាន
    { wch: 14 }, // បំណាច់
    { wch: 22 }, // មុខងារ
    { wch: 8 },  // កូន
    { wch: 8 },  // សហព័ទ្ធ
    { wch: 12 }, // តាមប្រភេទ
    { wch: 14 }, // កាលបរិច្ឆេទ
    { wch: 18 }, // លេខអត្តសញ្ញាណ
    { wch: 14 }, // សុពលភាព
    { wch: 14 }, // ផុតសុពលភាព
    { wch: 18 }, // គណនី
    { wch: 14 }, // ទូរសព្ទ
    { wch: 22 }  // សាលារៀន
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'ទិន្នន័យ');
  XLSX.writeFile(wb, 'គំរូទម្រង់ស្រង់ទិន្នន័យមន្ត្រីរាជការ_តាលោសែនជ័យ.xlsx');
  showToast('បានទាញយកឯកសារគំរូ Excel (.xlsx) ដោយជោគជ័យ!', 'success');
}
