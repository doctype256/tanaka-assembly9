// activity-reports.js
async function fetchActivityReports() {
  const res = await fetch('/api/activity-reports');
  const data = await res.json();
  if (!data.success) return [];
  return data.reports;
}

async function renderActivityReportsList() {
  const reports = await fetchActivityReports();
  const root = document.getElementById('policy-carousel-container');
  if (!root) return;
  root.innerHTML = '';

  const categories = [
    { id: 'committee', label: '委員会活動' },
    { id: 'childcare', label: '子育て政策' },
    { id: 'reform', label: '京都府議会・定例会' },
    { id: 'topics', label: 'Topics' }
  ];
  
  const years = Array.from(new Set(reports.map(r => r.year))).sort((a, b) => b - a);
  const catButtons = document.getElementById('category-buttons');
  const yearButtons = document.getElementById('year-buttons');
  
  let activeCategory = 'all';
  let activeYear = 'all';

  function renderFilters() {
    if (!catButtons || !yearButtons) return;
    catButtons.innerHTML = `<button data-category="all" class="${activeCategory === 'all' ? 'is-active' : ''}">すべて</button>` +
      categories.map(cat => `<button data-category="${cat.id}" class="${activeCategory === cat.id ? 'is-active' : ''}">${cat.label}</button>`).join('');
    
    yearButtons.innerHTML = `<button data-year="all" class="${activeYear === 'all' ? 'is-active' : ''}">すべての年</button>` +
      years.map(y => `<button data-year="${y}" class="${activeYear == y ? 'is-active' : ''}">${y}年</button>`).join('');
  }

  function renderList() {
    root.innerHTML = '';
    let filtered = reports;
    if (activeCategory !== 'all') filtered = filtered.filter(r => r.category === activeCategory);
    if (activeYear !== 'all') filtered = filtered.filter(r => String(r.year) === String(activeYear));

    if (filtered.length > 0) {
      const sorted = filtered.slice().sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return (b.id || 0) - (a.id || 0);
      });
      const list = sorted.slice(0, 5);
      const wrapper = document.createElement('div');
      wrapper.className = 'pdf-carousel-wrapper';
      const carousel = document.createElement('div');
      carousel.className = 'pdf-carousel';
      carousel.style.overflow = 'hidden';
      carousel.style.position = 'relative';
      carousel.style.width = '100%';
      carousel.style.padding = '60px 0';
      const inner = document.createElement('div');
      inner.className = 'pdf-carousel-inner';
      inner.style.display = 'flex';
      inner.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
      inner.style.alignItems = 'center';
      list.forEach((r) => {
        const div = document.createElement('div');
        div.className = 'pdf-item';
        div.style.flex = '0 0 300px';
        div.style.margin = '0 20px';
        div.style.transition = 'all 0.5s ease';
        div.style.opacity = '0.3';
        div.style.transform = 'scale(0.85)';
        let yyyymm = '';
        if (r.updated_at) {
          const d = new Date(r.updated_at);
          yyyymm = `${d.getFullYear()}年${d.getMonth() + 1}月`;
        } else if (r.created_at) {
          const d = new Date(r.created_at);
          yyyymm = `${d.getFullYear()}年${d.getMonth() + 1}月`;
        } else if (r.year) {
          yyyymm = `${r.year}年`;
        }
        div.innerHTML = `
          <div class="report-thumb">
            <img src="${(r.photos && r.photos[0]) ? r.photos[0] : ''}" alt="${r.title}" style="width:100%; height:200px; object-fit:cover;" onerror="this.src='https://placehold.jp/24/03709b/ffffff/300x200.png?text=No+Photo'">
          </div>
          <div class="pdf-item-meta">
            <span class="report-meta-year">${yyyymm}</span> ／ <span class="report-meta-cat">${r.category}</span>
          </div>
          <h3 class="report-title">${r.title}</h3>
          <div class="pdf-actions">
            <a href="article.html?type=report&id=${r.id}" class="pdf-btn">詳しく見る</a>
          </div>
        `;
        inner.appendChild(div);
      });
      carousel.appendChild(inner);
      wrapper.appendChild(carousel);
      root.appendChild(wrapper);
    }
  }

  renderFilters();
  renderList();

  catButtons?.addEventListener('click', (e) => {
    if (e.target.dataset.category) {
      activeCategory = e.target.dataset.category;
      renderFilters();
      renderList();
    }
  });

  yearButtons?.addEventListener('click', (e) => {
    if (e.target.dataset.year) {
      activeYear = e.target.dataset.year;
      renderFilters();
      renderList();
    }
  });
}

window.renderActivityReportsList = renderActivityReportsList;
