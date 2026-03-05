fetch('data/static-texts.json')
  .then(res => res.json())
  .then(data => {

    /* ===== header name ===== */
    const headerName = document.getElementById('header-name');
    if (headerName) {
      headerName.textContent = data.profile.name;
    }

    /* ===== header nav ===== */
    const headerNav = document.getElementById('header-nav');
    if (headerNav) {
      headerNav.innerHTML = '';

      data.navigation.forEach(n => {
        const a = document.createElement('a');
        a.href = n.href.startsWith('#')
          ? 'index.html' + n.href
          : n.href;
        a.textContent = n.text;
        headerNav.appendChild(a);
      });
    }

    /* ===== hamburger control ===== */
    const toggle = document.getElementById('menu-toggle');
    if (toggle && headerNav) {
      toggle.addEventListener('click', () => {
        headerNav.classList.toggle('open');
      });
    }

  })
  .catch(err => console.error('header.js error:', err));
