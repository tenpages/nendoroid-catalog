// Nendoroid Catalog Application
(function() {
    'use strict';

    // State
    let nendoroids = [];
    let userData = { owned: [], wishlist: [] };
    let dxMode = 'separate'; // 'separate' or 'variant'
    let showDXVariant = false; // For variant mode - whether to show DX info
    let filters = {
        search: '',
        fandom: '',
        gender: '',
        hairColors: [],
        clothesColors: [],
        parts: [],
        idMin: '',
        idMax: ''
    };  

    // DOM Elements
    const catalogGrid = document.getElementById('catalog-grid');
    const searchInput = document.getElementById('search-input');
    const fandomFilter = document.getElementById('fandom-filter');
    const genderFilter = document.getElementById('gender-filter');
    const hairColorFilters = document.getElementById('hair-color-filters');
    const clothesColorFilters = document.getElementById('clothes-color-filters');
    const partsFilters = document.getElementById('parts-filters');
    const idMinInput = document.getElementById('id-min');
    const idMaxInput = document.getElementById('id-max');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const totalCount = document.getElementById('total-count');
    const ownedCount = document.getElementById('owned-count');
    const wishlistCount = document.getElementById('wishlist-count');
    const noResults = document.getElementById('no-results');
    const modal = document.getElementById('nendoroid-modal');
    const modalBody = document.getElementById('modal-body');
    // Select the close button specifically inside the detail modal to avoid conflicts with other modals
    const modalClose = document.querySelector('#nendoroid-modal .modal-close');
    const dxModeSelect = document.getElementById('dx-mode-select');
    const languageSelect = document.getElementById('language-select');

    // Track focus return for the detail modal
    let _lastActiveElForModal = null;

    // Initialize
    async function init() {
        await Translations.init();
        setupLanguageSelector();
        
        await loadNendoroids();
        loadUserData();
        loadDXPreference();
        renderFilters();
        renderCatalog();
        attachEventListeners();
        
        // Listen for language changes
        window.addEventListener('languageChanged', handleLanguageChange);
    }

    // Setup language selector
    function setupLanguageSelector() {
        const languages = Translations.getAvailableLanguages();
        languageSelect.innerHTML = '';
        
        for (const [code, lang] of Object.entries(languages)) {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = lang.nativeName;
            languageSelect.appendChild(option);
        }
        
        languageSelect.value = Translations.getCurrentLang();
    }

    // Handle language change
    function handleLanguageChange(e) {
        // Apply translations to static UI elements
        Translations.applyTranslations();
        
        // Save current filter values before re-rendering
        const currentFandom = filters.fandom;
        const currentGender = filters.gender;
        const currentSearch = filters.search;
        const currentIdMin = filters.idMin;
        const currentIdMax = filters.idMax;
        
        renderCatalog();
        renderFilters();
        
        // Restore filter values after re-rendering
        filters.fandom = currentFandom;
        filters.gender = currentGender;
        filters.search = currentSearch;
        filters.idMin = currentIdMin;
        filters.idMax = currentIdMax;
        
        // Update form elements
        searchInput.value = currentSearch || '';
        fandomFilter.value = currentFandom || '';
        genderFilter.value = currentGender || '';
        if (idMinInput) idMinInput.value = currentIdMin || '';
        if (idMaxInput) idMaxInput.value = currentIdMax || '';
        
        // Re-render catalog with restored filter values
        renderCatalog();
    }

    // Load Nendoroids data
    async function loadNendoroids() {
        try {
            const response = await fetch('data/nendoroids.json');
            if (!response.ok) {
                throw new Error('Failed to load nendoroids data');
            }
            nendoroids = await response.json();
        } catch (error) {
            console.error('Error loading nendoroids:', error);
            catalogGrid.innerHTML = '<p class="no-results">' + Translations.t('noResults') + '</p>';
        }
    }

    // Load user data from localStorage
    function loadUserData() {
        const saved = localStorage.getItem('nendoroidUserData');
        if (saved) {
            try {
                userData = JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing user data:', e);
                userData = { owned: [], wishlist: [] };
            }
        }
    }

    // Load DX preference from localStorage
    function loadDXPreference() {
        const savedMode = localStorage.getItem('dxMode');
        if (savedMode !== null) {
            dxMode = savedMode;
            dxModeSelect.value = dxMode;
        }
        
        const savedVariant = localStorage.getItem('showDXVariant');
        if (savedVariant !== null) {
            showDXVariant = JSON.parse(savedVariant);
        }
    }

    // Save DX mode preference to localStorage
    function saveDXModePreference() {
        localStorage.setItem('dxMode', dxMode);
    }

    // Save DX variant preference to localStorage
    function saveDXVariantPreference() {
        localStorage.setItem('showDXVariant', JSON.stringify(showDXVariant));
    }

    // Save user data to localStorage
    function saveUserData() {
        localStorage.setItem('nendoroidUserData', JSON.stringify(userData));
    }

    // Get translated part name
    function getTranslatedPartName(partName) {
        // Look for a nendoroid that has this part and get its translation
        for (const nendoroid of nendoroids) {
            const translated = Translations.getTranslatedNendoroid(nendoroid);
            if (translated.parts && translated.parts.includes(partName)) {
                return partName; // Return original if not found in translation
            }
            // Also check if the translated has a different part name
            if (translated.parts) {
                const index = nendoroid.parts.indexOf(partName);
                if (index !== -1 && translated.parts[index] !== partName) {
                    return translated.parts[index];
                }
            }
        }
        return partName;
    }

    // Render filter options
    function renderFilters() {
        // Get unique values for filters
        const fandoms = [...new Set(nendoroids.map(n => n.fandom))].sort();
        const hairColors = [...new Set(nendoroids.flatMap(n => n.hairColor || []))].sort();
        const clothesColors = [...new Set(nendoroids.flatMap(n => n.clothesColor || []))].sort();
        const parts = [...new Set(nendoroids.flatMap(n => n.parts || []))].sort();

        // Clear existing fandom options except the first one
        while (fandomFilter.options.length > 1) {
            fandomFilter.remove(1);
        }

        // Render fandom filter
        fandoms.forEach(fandom => {
            const option = document.createElement('option');
            option.value = fandom;
            option.textContent = Translations.getTranslatedFandom(fandom, nendoroids);
            if (option.textContent.trim() !== '') {
                fandomFilter.appendChild(option);
            }
        });
    
        // // Clear and render hair color checkboxes
        // hairColorFilters.innerHTML = '';
        // hairColors.forEach(color => {
        //     hairColorFilters.appendChild(createCheckbox('hairColor', color, null, filters.hairColors));
        // });

        // // Clear and render clothes color checkboxes
        // clothesColorFilters.innerHTML = '';
        // clothesColors.forEach(color => {
        //     clothesColorFilters.appendChild(createCheckbox('clothesColor', color, null, filters.clothesColors));
        // });

        // // Clear and render parts checkboxes with translations
        // partsFilters.innerHTML = '';
        // parts.forEach(part => {
        //     const translatedPart = getTranslatedPartName(part);
        //     partsFilters.appendChild(createCheckbox('parts', translatedPart, part, filters.parts));
        // });
    }

    // Create checkbox element
    function createCheckbox(name, displayValue, actualValue, filterArray) {
        actualValue = actualValue || displayValue;
        const label = document.createElement('label');
        label.className = 'checkbox-item';
        const isChecked = filterArray && filterArray.includes(actualValue);
        label.innerHTML = `
            <input type="checkbox" name="${name}" value="${actualValue}"${isChecked ? ' checked' : ''}>
            <span>${displayValue}</span>
        `;
        return label;
    }

    // Get DX version for a base nendoroid
    function getDXVersion(baseId) {
        return nendoroids.find(n => n.linkedId === baseId && n.isDX);
    }

    // Check if a nendoroid has a DX version
    function hasDXVersion(baseId) {
        return getDXVersion(baseId) !== undefined;
    }

    // Get DX version for a base nendoroid
    function getPlainVersion(baseId) {
        return nendoroids.find(n => n.linkedId === baseId && !n.isDX);
    }

    // Render catalog
    function renderCatalog() {
        const filtered = filterNendoroids();
        
        if (filtered.length === 0) {
            catalogGrid.innerHTML = '';
            noResults.style.display = 'block';
            updateStats(filtered);
            return;
        }

        noResults.style.display = 'none';
        catalogGrid.innerHTML = filtered.map(nendoroid => createCardHTML(nendoroid)).join('');

        // Attach card click events
        document.querySelectorAll('.nendoroid-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('action-btn')) {
                    const id = card.dataset.id;
                    const isVariantMode = card.dataset.variantMode === 'true';
                    const showVariant = card.dataset.showVariant === 'true';
                    
                    // In variant mode, determine which version to show
                    let nendoroidToShow = nendoroids.find(n => n.id === id);
                    if (isVariantMode && showVariant) {
                        const dxVersion = getDXVersion(id);
                        if (dxVersion) {
                            nendoroidToShow = dxVersion;
                        }
                    }
                    showModal(nendoroidToShow);
                }
            });
        });

        // Attach action button events
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const type = btn.dataset.type;
                toggleCollection(id, type);
            });
        });

        // Update header stats to reflect the current filtered results
        updateStats(filtered);
    }

    // Create card HTML
    function createCardHTML(nendoroid) {
        // Get translated nendoroid data
        const translated = Translations.getTranslatedNendoroid(nendoroid);
        
        const isOwned = userData.owned.includes(nendoroid.id);
        const isWishlisted = userData.wishlist.includes(nendoroid.id);
        const boxColor = nendoroid.boxColor || '#ff6600';
        const isDX = nendoroid.isDX || false;
        const linkedId = nendoroid.linkedId || null;
        
        // Check if this base version has a DX variant
        const hasDX = !isDX && hasDXVersion(nendoroid.id);
        const dxVersion = hasDX ? getDXVersion(nendoroid.id) : null;

        // Determine if we should show DX indicator
        let showDXIndicator = false;
        if (dxMode === 'variant' && hasDX) {
            showDXIndicator = true;
        }

        return `
            <div class="nendoroid-card" data-id="${nendoroid.id}" data-variant-mode="${dxMode === 'variant'}" data-show-variant="${showDXVariant && hasDX}" style="--box-color: ${boxColor}">
                <img src="${nendoroid.officialPhoto}" alt="${translated.name}" class="card-image" loading="lazy">
                <div class="card-body">
                    <div>
                        <span class="card-id ${isDX ? 'dx' : ''}">${nendoroid.id}${isDX ? ' ' + Translations.t('card.dx') : ''}</span>
                        <span class="card-id" style="background: #666;">${translated.fandom}</span>
                        ${linkedId && (dxMode != 'variant') ? `<span class="card-id" style="background: #888;">← ${linkedId}</span>` : ''}
                        ${showDXIndicator ? `<span class="card-id dx-indicator">${Translations.t('card.dxIndicator')}</span>` : ''}
                    </div>
                    <h3 class="card-name">${translated.name}</h3>
                    <div class="card-tags">
                        <span class="tag">${nendoroid.gender}</span>
                        ${(nendoroid.hairColor || []).slice(0, 2).map(c => `<span class="tag">${c}</span>`).join('')}
                    </div>
                    <div class="card-actions">
                        <button class="action-btn owned-btn ${isOwned ? 'owned' : ''}" data-id="${nendoroid.id}" data-type="owned">
                            ${isOwned ? '✓ ' + Translations.t('btn.owned') : Translations.t('btn.addOwned')}
                        </button>
                        <button class="action-btn wishlist ${isWishlisted ? 'wishlisted' : ''}" data-id="${nendoroid.id}" data-type="wishlist">
                            ${isWishlisted ? '★ ' + Translations.t('btn.inWishlist') : Translations.t('btn.addWishlist')}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Get displayed nendoroids based on DX mode
    function getDisplayedNendoroids() {
        if (dxMode === 'variant') {
            // In variant mode, only show base versions (non-DX)
            // DX versions are shown as variants within their base version
            return nendoroids.filter(n => !n.isDX);
        } else {
            // Separate mode: Show all nendoroids (base and DX as separate items)
            return nendoroids;
        }
    }

    // Get numeric part of an id string (e.g., "1580DX" -> 1580)
    function getNumericId(idStr) {
        if (!idStr) return NaN;
        const m = String(idStr).match(/\d+/);
        return m ? parseInt(m[0], 10) : NaN;
    }

    // Helper to check membership in a set by either exact string match or numeric id match
    function idMatchesSet(id, stringSet, numericSet) {
        const idStr = String(id);
        if (stringSet.has(idStr)) return true;
        const n = getNumericId(idStr);
        return Number.isFinite(n) && numericSet.has(n);
    }

    // Returns true if any filter field is active
    function isAnyFilterApplied() {
        if (filters.search && String(filters.search).trim() !== '') return true;
        if (filters.fandom && String(filters.fandom).trim() !== '') return true;
        if (filters.gender && String(filters.gender).trim() !== '') return true;
        if (filters.hairColors && filters.hairColors.length > 0) return true;
        if (filters.clothesColors && filters.clothesColors.length > 0) return true;
        if (filters.parts && filters.parts.length > 0) return true;
        if (filters.idMin && String(filters.idMin).trim() !== '') return true;
        if (filters.idMax && String(filters.idMax).trim() !== '') return true;
        return false;
    }

    // Filter nendoroids
    function filterNendoroids() {
        const displayed = getDisplayedNendoroids();
        
        return displayed.filter(nendoroid => {
            const translated = Translations.getTranslatedNendoroid(nendoroid);
            
            // Search filter (search in current language)
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const searchMatch = 
                    translated.name.toLowerCase().includes(searchLower) ||
                    translated.fandom.toLowerCase().includes(searchLower) ||
                    nendoroid.id.toLowerCase().includes(searchLower);
                if (!searchMatch) return false;
            }

            // Fandom filter
            if (filters.fandom && translated.fandom !== filters.fandom && nendoroid.fandom !== filters.fandom) return false;

            // Gender filter
            if (filters.gender && nendoroid.gender !== filters.gender) return false;

            // Numeric min/max explicit fields take precedence
            if (filters.idMin || filters.idMax) {
                const minVal = filters.idMin ? parseInt(filters.idMin, 10) : NaN;
                const maxVal = filters.idMax ? parseInt(filters.idMax, 10) : NaN;
                const min = Number.isFinite(minVal) ? minVal : -Infinity;
                const max = Number.isFinite(maxVal) ? maxVal : Infinity;
                const idNum = getNumericId(nendoroid.id);
                const linkedNum = getNumericId(nendoroid.linkedId);
                const inRange = (Number.isFinite(idNum) && idNum >= min && idNum <= max) || (Number.isFinite(linkedNum) && linkedNum >= min && linkedNum <= max);
                if (!inRange) return false;
            }



            // Hair color filter (OR logic within, AND between filters)
            if (filters.hairColors.length > 0) {
                const hasMatchingColor = filters.hairColors.some(color => 
                    (nendoroid.hairColor || []).includes(color)
                );
                if (!hasMatchingColor) return false;
            }

            // Clothes color filter
            if (filters.clothesColors.length > 0) {
                const hasMatchingColor = filters.clothesColors.some(color => 
                    (nendoroid.clothesColor || []).includes(color)
                );
                if (!hasMatchingColor) return false;
            }

            // Parts filter
            if (filters.parts.length > 0) {
                const hasAllParts = filters.parts.every(part => 
                    (nendoroid.parts || []).includes(part) || (translated.parts || []).includes(part)
                );
                if (!hasAllParts) return false;
            }

            return true;
        });
    }

    // Toggle collection status
    function toggleCollection(id, type) {
        const index = userData[type].indexOf(id);
        const otherType = type === 'owned' ? 'wishlist' : 'owned';
        if (index === -1) {
            // Add to the selected collection
            userData[type].push(id);
            // Ensure mutual exclusivity: remove from the other collection if present
            const otherIndex = userData[otherType].indexOf(id);
            if (otherIndex !== -1) {
                userData[otherType].splice(otherIndex, 1);
            }
        } else {
            // Remove from the selected collection
            userData[type].splice(index, 1);
        }
        saveUserData();
        renderCatalog();
    }

    // Update stats (shows counts for the currently filtered items)
    function updateStats(filtered = null) {
        // If filtered list not provided, compute using current filters and DX mode
        if (!filtered) filtered = filterNendoroids();
        totalCount.textContent = filtered.length;

        // Only count owned/wishlist items that are included in the filtered set
        const filteredIds = new Set(filtered.map(n => String(n.id)));
        const filteredNumeric = new Set([...filteredIds].map(s => getNumericId(s)).filter(Number.isFinite));
        const filteredOwned = userData.owned.filter(id => idMatchesSet(id, filteredIds, filteredNumeric));
        const filteredWishlist = userData.wishlist.filter(id => idMatchesSet(id, filteredIds, filteredNumeric));
        ownedCount.textContent = filteredOwned.length;
        wishlistCount.textContent = filteredWishlist.length;

        // Update header label and highlight when any filter is applied
        const totalLabelEl = document.querySelector('[data-i18n="stats.total"]') || document.querySelector('.stat-item span');
        const hasFilter = isAnyFilterApplied();
        if (totalLabelEl) {
            totalLabelEl.textContent = hasFilter ? Translations.t('stats.matches') : Translations.t('stats.total');
        }

        [totalCount, ownedCount, wishlistCount].forEach(el => {
            if (hasFilter) el.classList.add('filtered'); else el.classList.remove('filtered');
        });

        // Compute unfiltered counts (for tooltip content)
        const displayedAll = getDisplayedNendoroids();
        const allIds = new Set(displayedAll.map(n => String(n.id)));
        const allNumeric = new Set([...allIds].map(s => getNumericId(s)).filter(Number.isFinite));
        const unfilteredTotal = displayedAll.length;
        const unfilteredOwned = userData.owned.filter(id => idMatchesSet(id, allIds, allNumeric)).length;
        const unfilteredWishlist = userData.wishlist.filter(id => idMatchesSet(id, allIds, allNumeric)).length;

        // Update aria-label for accessibility; tooltip will show the custom styled content on hover/focus
        if (hasFilter) {
            if (totalCount) {
                const label = Translations.t('stats.unfilteredTotal', { count: unfilteredTotal });
                totalCount.setAttribute('aria-label', label);
                totalCount.dataset.unfiltered = unfilteredTotal;
            }
            if (ownedCount) {
                const label = Translations.t('stats.unfilteredOwned', { count: unfilteredOwned });
                ownedCount.setAttribute('aria-label', label);
                ownedCount.dataset.unfiltered = unfilteredOwned;
            }
            if (wishlistCount) {
                const label = Translations.t('stats.unfilteredWishlist', { count: unfilteredWishlist });
                wishlistCount.setAttribute('aria-label', label);
                wishlistCount.dataset.unfiltered = unfilteredWishlist;
            }
        } else {
            if (totalCount) {
                totalCount.removeAttribute('aria-label');
                delete totalCount.dataset.unfiltered;
            }
            if (ownedCount) {
                ownedCount.removeAttribute('aria-label');
                delete ownedCount.dataset.unfiltered;
            }
            if (wishlistCount) {
                wishlistCount.removeAttribute('aria-label');
                delete wishlistCount.dataset.unfiltered;
            }
        }
    }

    // --- Custom stat tooltip ---
    let _statTooltip = null;
    const STAT_TOOLTIP_ID = 'stat-tooltip';

    function createStatTooltip() {
        if (_statTooltip) return;
        _statTooltip = document.createElement('div');
        _statTooltip.id = STAT_TOOLTIP_ID;
        _statTooltip.className = 'stat-tooltip';
        document.body.appendChild(_statTooltip);
    }

    function showStatTooltip(targetEl, content) {
        if (!targetEl || !content) return;
        createStatTooltip();
        _statTooltip.innerHTML = content;
        _statTooltip.classList.add('active');
        _statTooltip.classList.remove('below');

        // Positioning
        const rect = targetEl.getBoundingClientRect();
        const ttRect = _statTooltip.getBoundingClientRect();
        let left = rect.left + (rect.width / 2) - (ttRect.width / 2) + window.scrollX;
        let top = rect.top - ttRect.height - 8 + window.scrollY;

        // Flip below if not enough space above
        if (top < window.scrollY + 8) {
            top = rect.bottom + 8 + window.scrollY;
            _statTooltip.classList.add('below');
            _statTooltip.style.top = top + 'px';
            _statTooltip.style.left = left + 'px';
            _statTooltip.style.transform = 'translateY(0)';
        } else {
            _statTooltip.classList.remove('below');
            _statTooltip.style.top = top + 'px';
            _statTooltip.style.left = left + 'px';
        }

        // ensure on-screen horizontally
        const padding = 8;
        const minLeft = padding + window.scrollX;
        const maxLeft = window.scrollX + document.documentElement.clientWidth - _statTooltip.offsetWidth - padding;
        if (left < minLeft) _statTooltip.style.left = minLeft + 'px';
        if (left > maxLeft) _statTooltip.style.left = maxLeft + 'px';

        // Link for accessibility
        targetEl.setAttribute('aria-describedby', STAT_TOOLTIP_ID);
    }

    function hideStatTooltip(e) {
        if (!_statTooltip) return;
        _statTooltip.classList.remove('active');
        // remove aria-describedby from any element that may have it
        [totalCount, ownedCount, wishlistCount].forEach(el => {
            if (el && el.getAttribute('aria-describedby') === STAT_TOOLTIP_ID) {
                el.removeAttribute('aria-describedby');
            }
        });
    }

    function setupStatTooltips() {
        createStatTooltip();
        [totalCount, ownedCount, wishlistCount].forEach(el => {
            if (!el) return;

            // attach handlers on the whole stat box (parent .stat-item)
            const itemEl = el.closest('.stat-item');
            if (!itemEl) return;

            // Make the whole box focusable for keyboard users
            itemEl.tabIndex = 0;

            itemEl.addEventListener('mouseenter', (ev) => {
                if (!isAnyFilterApplied()) return;
                // compute corresponding unfiltered count (robust id matching)
                const displayedAll = getDisplayedNendoroids();
                const allIds = new Set(displayedAll.map(n => String(n.id)));
                const allNumeric = new Set([...allIds].map(s => getNumericId(s)).filter(Number.isFinite));
                const unfilteredTotal = displayedAll.length;
                const unfilteredOwned = userData.owned.filter(id => idMatchesSet(id, allIds, allNumeric)).length;
                const unfilteredWishlist = userData.wishlist.filter(id => idMatchesSet(id, allIds, allNumeric)).length;

                let content = '';
                if (itemEl.contains(totalCount)) content = Translations.t('stats.unfilteredTotal', { count: unfilteredTotal });
                else if (itemEl.contains(ownedCount)) content = Translations.t('stats.unfilteredOwned', { count: unfilteredOwned });
                else if (itemEl.contains(wishlistCount)) content = Translations.t('stats.unfilteredWishlist', { count: unfilteredWishlist });

                showStatTooltip(itemEl, content);
            });

            itemEl.addEventListener('mouseleave', hideStatTooltip);

            itemEl.addEventListener('focus', (ev) => {
                if (!isAnyFilterApplied()) return;
                // replicate mouseenter behavior (robust id matching)
                const displayedAll = getDisplayedNendoroids();
                const allIds = new Set(displayedAll.map(n => String(n.id)));
                const allNumeric = new Set([...allIds].map(s => getNumericId(s)).filter(Number.isFinite));
                const unfilteredTotal = displayedAll.length;
                const unfilteredOwned = userData.owned.filter(id => idMatchesSet(id, allIds, allNumeric)).length;
                const unfilteredWishlist = userData.wishlist.filter(id => idMatchesSet(id, allIds, allNumeric)).length;

                let content = '';
                if (itemEl.contains(totalCount)) content = Translations.t('stats.unfilteredTotal', { count: unfilteredTotal });
                else if (itemEl.contains(ownedCount)) content = Translations.t('stats.unfilteredOwned', { count: unfilteredOwned });
                else if (itemEl.contains(wishlistCount)) content = Translations.t('stats.unfilteredWishlist', { count: unfilteredWishlist });

                showStatTooltip(itemEl, content);
            });

            itemEl.addEventListener('blur', hideStatTooltip);
        });

        // hide tooltip on scroll/resize
        window.addEventListener('scroll', hideStatTooltip, true);
        window.addEventListener('resize', hideStatTooltip);
    }

    // ensure tooltips setup after event listeners registered
    // Call setupStatTooltips at the end of attachEventListeners()
        setupStatTooltips();

        // --- Export Grid Image ---
        const exportGridBtn = document.getElementById('export-grid');

        function hexToRgb(hex) {
            if (!hex) return null;
            const s = String(hex).replace('#', '').trim();
            if (s.length === 3) {
                return {
                    r: parseInt(s[0] + s[0], 16),
                    g: parseInt(s[1] + s[1], 16),
                    b: parseInt(s[2] + s[2], 16)
                };
            }
            if (s.length === 6) {
                return {
                    r: parseInt(s.substring(0,2), 16),
                    g: parseInt(s.substring(2,4), 16),
                    b: parseInt(s.substring(4,6), 16)
                };
            }
            return null;
        }

        function rgbToHex(r,g,b){
            return '#' + [r,g,b].map(v => {
                const s = Math.round(v).toString(16);
                return s.length === 1 ? '0' + s : s;
            }).join('');
        }

        function lightenColor(hex, amount){
            const rgb = hexToRgb(hex) || { r: 136, g: 136, b: 136 };
            const r = Math.round(rgb.r + (255 - rgb.r) * amount);
            const g = Math.round(rgb.g + (255 - rgb.g) * amount);
            const b = Math.round(rgb.b + (255 - rgb.b) * amount);
            return rgbToHex(r,g,b);
        }

        function luminance(hex){
            const rgb = hexToRgb(hex) || { r: 136, g: 136, b: 136 };
            // relative luminance (0..1)
            const a = [rgb.r, rgb.g, rgb.b].map(v => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
        }

        // Helper to load images with a timeout
        function loadImage(url, timeout = 4000) {
            return new Promise((resolve) => {
                if (!url) return resolve(null);
                const img = new Image();
                img.crossOrigin = 'anonymous';
                let resolved = false;
                const to = setTimeout(() => { if (!resolved) { resolved = true; resolve(null); } }, timeout);
                img.onload = () => { if (!resolved) { resolved = true; clearTimeout(to); resolve(img); } };
                img.onerror = () => { if (!resolved) { resolved = true; clearTimeout(to); resolve(null); } };
                img.src = url;
            });
        }

        async function generateGridImageForItems(items, options = {}) {
            const { cols = 20, cellSizeDefault = 64, padding = 1, style = 'simple', filenamePrefix = 'nendoroid-grid' } = options;
            try {
                if (!items || items.length === 0) {
                    alert(Translations.t('export.error') || 'Nothing to export');
                    return;
                }

                const count = items.length;
                const colsActual = Math.min(cols, Math.max(1, cols));
                const rows = Math.ceil(count / colsActual) || 1;

                let cellSize = cellSizeDefault;
                let canvasWidth = colsActual * cellSize;
                let canvasHeight = rows * cellSize;

                const MAX_DIM = 8192;
                if (canvasWidth > MAX_DIM || canvasHeight > MAX_DIM) {
                    const scale = Math.min(MAX_DIM / canvasWidth, MAX_DIM / canvasHeight);
                    cellSize = Math.max(8, Math.floor(cellSize * scale));
                    canvasWidth = colsActual * cellSize;
                    canvasHeight = rows * cellSize;
                }

                const canvas = document.createElement('canvas');
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                const ctx = canvas.getContext('2d');

                // background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0,0,canvas.width,canvas.height);

                // prepare ownership sets
                const ownedStrings = new Set((userData.owned || []).map(String));
                const ownedNums = new Set((userData.owned || []).map(id => getNumericId(String(id))).filter(Number.isFinite));
                const wishStrings = new Set((userData.wishlist || []).map(String));
                const wishNums = new Set((userData.wishlist || []).map(id => getNumericId(String(id))).filter(Number.isFinite));

                for (let i=0;i<count;i++){
                    const item = items[i];
                    const col = i % colsActual;
                    const row = Math.floor(i / colsActual);
                    const x = col * cellSize;
                    const y = row * cellSize;

                    const boxColor = item.boxColor || '#ff6600';

                    if (style === 'catalog') {
                        // draw cell background
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(x + padding, y + padding, cellSize - padding * 2, cellSize - padding * 2);

                        // draw image if available
                        const img = await loadImage(item.officialPhoto);
                        if (img) {
                            const imgPad = 6;
                            const availableHeight = cellSize - imgPad * 2 - 22; // leave room for id bar
                            const availWidth = cellSize - imgPad * 2;
                            let w = img.width;
                            let h = img.height;
                            const ratio = Math.min(availWidth / w, availableHeight / h, 1);
                            w = Math.round(w * ratio);
                            h = Math.round(h * ratio);
                            const imgX = x + (cellSize - w) / 2;
                            const imgY = y + imgPad;
                            ctx.drawImage(img, imgX, imgY, w, h);
                        } else {
                            // fallback box using boxColor
                            ctx.fillStyle = lightenColor(boxColor, 0.4);
                            ctx.fillRect(x + padding + 4, y + padding + 4, cellSize - padding * 2 - 8, cellSize - padding * 2 - 8 - 22);
                        }

                        // id bar
                        const barHeight = 22;
                        ctx.fillStyle = boxColor;
                        ctx.fillRect(x + padding, y + cellSize - barHeight - padding, cellSize - padding * 2, barHeight);
                        ctx.fillStyle = '#ffffff';
                        const fontSize = Math.max(10, Math.floor(barHeight * 0.6));
                        ctx.font = `${fontSize}px sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(String(item.id), x + cellSize / 2, y + cellSize - barHeight / 2 - padding);

                    } else {
                        // simple square style
                        let fill = '#dddddd';
                        if (idMatchesSet(item.id, ownedStrings, ownedNums)) {
                            fill = boxColor;
                        } else if (idMatchesSet(item.id, wishStrings, wishNums)) {
                            fill = lightenColor(boxColor, 0.6);
                        } else {
                            fill = '#e0e0e0';
                        }

                        // cell background
                        ctx.fillStyle = fill;
                        ctx.fillRect(x + padding, y + padding, cellSize - padding * 2, cellSize - padding * 2);

                        // border
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x + padding, y + padding, cellSize - padding * 2, cellSize - padding * 2);

                        // text (id)
                        const text = String(item.id);
                        const textColor = luminance(fill) > 0.5 ? '#000000' : '#ffffff';
                        ctx.fillStyle = textColor;
                        const fontSize = Math.max(10, Math.floor(cellSize * 0.28));
                        ctx.font = `${fontSize}px sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(text, x + cellSize / 2, y + cellSize / 2);
                    }
                }

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                if (!blob) {
                    alert(Translations.t('export.error'));
                    return;
                }
                const url = URL.createObjectURL(blob);
                showExportPreview(url, blob, `${filenamePrefix}-${Date.now()}.png`);
            } catch (err) {
                console.error('Error generating grid image', err);
                alert(Translations.t('export.error'));
            }
        }

        // wrappers for different export modes
        async function generateGridAll() {
            const btn = document.getElementById('export-grid-all');
            const orig = btn ? btn.textContent : null;
            try {
                if (btn) { btn.disabled = true; btn.textContent = Translations.t('export.generating') || 'Generating...'; }
                const items = filterNendoroids();
                await generateGridImageForItems(items, { cols: 20, cellSizeDefault: 64, style: 'simple', filenamePrefix: 'nendoroid-grid' });
            } finally {
                if (btn) { btn.disabled = false; if (orig) btn.textContent = orig; }
            }
        }

        async function generateGridOwnedWishlist() {
            const btn = document.getElementById('export-grid-owned-wishlist');
            const orig = btn ? btn.textContent : null;
            try {
                if (btn) { btn.disabled = true; btn.textContent = Translations.t('export.generating') || 'Generating...'; }
                const displayed = filterNendoroids();
                const ownedStrings = new Set((userData.owned || []).map(String));
                const ownedNums = new Set((userData.owned || []).map(id => getNumericId(String(id))).filter(Number.isFinite));
                const wishStrings = new Set((userData.wishlist || []).map(String));
                const wishNums = new Set((userData.wishlist || []).map(id => getNumericId(String(id))).filter(Number.isFinite));
                const items = displayed.filter(item => idMatchesSet(item.id, ownedStrings, ownedNums) || idMatchesSet(item.id, wishStrings, wishNums));
                await generateGridImageForItems(items, { cols: 10, cellSizeDefault: 96, style: 'simple', filenamePrefix: 'nendoroid-owned-wishlist' });
            } finally {
                if (btn) { btn.disabled = false; if (orig) btn.textContent = orig; }
            }
        }

        async function generateGridOwnedCatalog() {
            const btn = document.getElementById('export-grid-owned');
            const orig = btn ? btn.textContent : null;
            try {
                if (btn) { btn.disabled = true; btn.textContent = Translations.t('export.generating') || 'Generating...'; }
                const displayed = filterNendoroids();
                const ownedStrings = new Set((userData.owned || []).map(String));
                const ownedNums = new Set((userData.owned || []).map(id => getNumericId(String(id))).filter(Number.isFinite));
                const items = displayed.filter(item => idMatchesSet(item.id, ownedStrings, ownedNums));
                await generateGridImageForItems(items, { cols: 4, cellSizeDefault: 160, style: 'catalog', filenamePrefix: 'nendoroid-owned-catalog' });
            } finally {
                if (btn) { btn.disabled = false; if (orig) btn.textContent = orig; }
            }
        }

        // Wire up export buttons
        const exportAllBtn = document.getElementById('export-grid-all');
        const exportOwnedWishlistBtn = document.getElementById('export-grid-owned-wishlist');
        const exportOwnedBtn = document.getElementById('export-grid-owned');

        if (exportAllBtn) exportAllBtn.addEventListener('click', () => generateGridAll());
        if (exportOwnedWishlistBtn) exportOwnedWishlistBtn.addEventListener('click', () => generateGridOwnedWishlist());
        if (exportOwnedBtn) exportOwnedBtn.addEventListener('click', () => generateGridOwnedCatalog());

        // Export preview helpers
        let _currentExportUrl = null;
        let _previousActiveEl = null;

        function showExportPreview(url, blob, filename) {
            const modalEl = document.getElementById('export-preview-modal');
            const img = document.getElementById('export-preview-img');
            const downloadBtn = document.getElementById('export-download');
            const scaleSelect = document.getElementById('export-scale-select');
            if (!modalEl || !img || !downloadBtn) {
                // fallback: trigger download directly
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                return;
            }

            _previousActiveEl = document.activeElement;
            _currentExportUrl = url;

            img.src = url;
            img.alt = Translations.t('export.preview.title');
            downloadBtn.dataset.url = url;
            downloadBtn.dataset.filename = filename;
            // default scale
            applyExportScale(scaleSelect ? scaleSelect.value : '100');

            modalEl.classList.add('active');
            modalEl.setAttribute('aria-hidden', 'false');
            downloadBtn.focus();
        }

        function closeExportPreview() {
            const modalEl = document.getElementById('export-preview-modal');
            const img = document.getElementById('export-preview-img');
            const scaleSelect = document.getElementById('export-scale-select');
            if (!modalEl) return;
            modalEl.classList.remove('active');
            modalEl.setAttribute('aria-hidden', 'true');

            if (img) {
                img.src = '';
                img.alt = '';
            }
            if (_currentExportUrl) {
                try { URL.revokeObjectURL(_currentExportUrl); } catch (e) {}
                _currentExportUrl = null;
            }
            if (_previousActiveEl && typeof _previousActiveEl.focus === 'function') {
                _previousActiveEl.focus();
                _previousActiveEl = null;
            }
        }

        function applyExportScale(value) {
            const img = document.getElementById('export-preview-img');
            if (!img) return;
            if (value === 'fit') {
                img.style.width = '100%';
                img.style.height = 'auto';
            } else {
                img.style.width = `${parseInt(value,10)}%`;
                img.style.height = 'auto';
            }
        }

        function setupExportPreview() {
            const modalEl = document.getElementById('export-preview-modal');
            if (!modalEl) return;
            const closeX = document.getElementById('export-preview-close');
            const closeBtn = document.getElementById('export-preview-close-btn');
            const downloadBtn = document.getElementById('export-download');
            const scaleSelect = document.getElementById('export-scale-select');

            if (closeX) closeX.addEventListener('click', closeExportPreview);
            if (closeBtn) closeBtn.addEventListener('click', closeExportPreview);
            modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeExportPreview(); });

            if (downloadBtn) {
                downloadBtn.addEventListener('click', (e) => {
                    const url = downloadBtn.dataset.url || _currentExportUrl;
                    const fn = downloadBtn.dataset.filename || (`nendoroid-grid-${Date.now()}.png`);
                    if (!url) return;
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fn;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                });
            }

            if (scaleSelect) {
                scaleSelect.addEventListener('change', (e) => applyExportScale(e.target.value));
            }

            document.addEventListener('keydown', (e) => {
                const isEsc = e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27;
                if (isEsc && modalEl.classList.contains('active')) {
                    closeExportPreview();
                    e.stopPropagation();
                }
            }, true);
        }

        // initialize preview handlers
        setupExportPreview();


    // Show modal
    function showModal(nendoroid) {
        if (!nendoroid) return;

        // Get translated nendoroid data
        const translated = Translations.getTranslatedNendoroid(nendoroid);
        
        const boxColor = nendoroid.boxColor || '#ff6600';
        const isOwned = userData.owned.includes(nendoroid.id);
        const isWishlisted = userData.wishlist.includes(nendoroid.id);
        const isDX = nendoroid.isDX || false;
        const linkedId = nendoroid.linkedId || null;
        
        // Check if this is a base version with DX variant
        const hasDX = !isDX && hasDXVersion(nendoroid.id);
        const dxVersion = hasDX ? getDXVersion(nendoroid.id) : null;
        const plainVersion = isDX ? getPlainVersion(nendoroid.id) : null;
        
        // In variant mode, show toggle to switch to DX version
        const showVariantToggle = dxMode === 'variant' && (hasDX || isDX);

        modalBody.innerHTML = `
            <img src="${nendoroid.officialPhoto}" alt="${translated.name}" class="modal-image">
            <div class="modal-body">
                <div class="modal-header">
                    <span class="modal-id ${isDX ? 'dx' : ''}" style="--box-color: ${boxColor}">${nendoroid.id}</span>
                    <h2 class="modal-title">${translated.name}</h2>
                </div>
                
                ${linkedId && hasDX ? `
                <div class="modal-section">
                    <div class="modal-info-item" style="background: #e8f4f8; width: 100%;">
                        <label>${Translations.t('modal.linkedVersion')}</label>
                        <span>${Translations.t('modal.linkedPlainVersion.text', { id: linkedId })}</span>
                    </div>
                </div>
                ` : ''}
                
                ${linkedId && !hasDX ? `
                <div class="modal-section">
                    <div class="modal-info-item" style="background: #e8f4f8; width: 100%;">
                        <label>${Translations.t('modal.linkedVersion')}</label>
                        <span>${Translations.t('modal.linkedDXVersion.text', { id: linkedId })}</span>
                    </div>
                </div>
                ` : ''}

                ${isDX && !linkedId ? `
                <div class="modal-section">
                    <div class="modal-info-item" style="background: #f8e8f4; width: 100%;">
                        <label>${Translations.t('modal.standaloneDX')}</label>
                        <span>${Translations.t('modal.standaloneDX.text')}</span>
                    </div>
                </div>
                ` : ''}
                
                ${showVariantToggle ? `
                <div class="modal-section">
                    <div class="modal-variant-toggle">
                        <label class="variant-toggle-label">
                            <input type="checkbox" id="variant-toggle" class="variant-toggle-input" ${showDXVariant ? 'checked' : 'unchecked'}>
                            <span class="variant-toggle-slider"></span>
                            <span class="variant-toggle-text">${Translations.t(hasDX ? 'modal.variantToggleOff' : 'modal.variantToggleOn')}</span>
                        </label>
                    </div>
                </div>
                ` : ''}
                
                <div class="modal-section">
                    <div class="modal-info-grid">
                        <div class="modal-info-item">
                            <label>${Translations.t('modal.fandom')}</label>
                            <span>${translated.fandom}</span>
                        </div>
                        <!------
                        <div class="modal-info-item">
                            <label>${Translations.t('modal.gender')}</label>
                            <span>${Translations.t('filter.gender.' + nendoroid.gender.toLowerCase())}</span>
                        </div>
                        -------->
                        ${nendoroid.releaseDate ? `
                        <div class="modal-info-item">
                            <label>${Translations.t('modal.releaseDate')}</label>
                            <span>${nendoroid.releaseDate}</span>
                        </div>
                        ` : ''}
                        ${nendoroid.price ? `
                        <div class="modal-info-item">
                            <label>${Translations.t('modal.price')}</label>
                            <span>¥${nendoroid.price.toLocaleString()}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="modal-section">
                    <h4>${Translations.t('modal.description')}</h4>
                    <p class="modal-description">${translated.description}</p>
                </div>
                
                <!-----
                <div class="modal-section">
                    <h4>${Translations.t('modal.colors')}</h4>
                    <div class="modal-colors">
                        <div class="modal-info-item">
                            <label>${Translations.t('modal.colors.hair')}</label>
                            <div style="display: flex; gap: 0.5rem; margin-top: 0.25rem;">
                                ${(nendoroid.hairColor || []).map(color => `
                                    <span class="color-swatch" style="background: ${color}" title="${color}"></span>
                                `).join('')}
                            </div>
                        </div>
                        <div class="modal-info-item">
                            <label>${Translations.t('modal.colors.clothes')}</label>
                            <div style="display: flex; gap: 0.5rem; margin-top: 0.25rem;">
                                ${(nendoroid.clothesColor || []).map(color => `
                                    <span class="color-swatch" style="background: ${color}" title="${color}"></span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                ----->

                ${(translated.parts || []).length > 0 ? `
                <div class="modal-section">
                    <h4>${Translations.t('modal.partsIncluded')}</h4>
                    <div class="modal-parts">
                        ${translated.parts.map(part => `<span class="part-tag" style="--box-color: ${boxColor}">${part}</span>`).join('')}
                    </div>
                </div>
                ` : ''}

                <div class="card-actions" style="margin-top: 1.5rem;">
                    <button class="action-btn owned-btn ${isOwned ? 'owned' : ''}" data-id="${nendoroid.id}" data-type="owned" style="padding: 1rem; font-size: 1rem;">
                        ${isOwned ? '✓ ' + Translations.t('btn.owned') : Translations.t('btn.addOwned')}
                    </button>
                    <button class="action-btn wishlist ${isWishlisted ? 'wishlisted' : ''}" data-id="${nendoroid.id}" data-type="wishlist" style="padding: 1rem; font-size: 1rem;">
                        ${isWishlisted ? '★ ' + Translations.t('btn.inWishlist') : Translations.t('btn.addWishlist')}
                    </button>
                </div>
            </div>
        `;

        // Attach modal action button events
        modalBody.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                const type = btn.dataset.type;
                toggleCollection(id, type);
                showModal(nendoroid); // Refresh modal
            });
        });

        // Attach variant toggle event
        const variantToggle = document.getElementById('variant-toggle');
        if (variantToggle) {
            variantToggle.addEventListener('change', (e) => {
                showDXVariant = e.target.checked;
                saveDXVariantPreference();
                if (dxVersion) {
                    showModal(dxVersion);
                }
                if (plainVersion) {
                    showModal(plainVersion);
                }
            });
        }

        // Ensure close handler is attached directly to the close button inside this modal
        _lastActiveElForModal = document.activeElement;
        const localClose = modal.querySelector('.modal-close');
        if (localClose) {
            // replace any existing handler to avoid duplicates
            localClose.onclick = hideModal;
            // add accessible label if not present
            if (!localClose.getAttribute('aria-label')) {
                localClose.setAttribute('aria-label', Translations.t('modal.close') || 'Close');
            }
        }

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        // focus the close button so keyboard users can easily dismiss
        if (localClose && typeof localClose.focus === 'function') localClose.focus();
    }

    // Hide modal
    function hideModal() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        if (_lastActiveElForModal && typeof _lastActiveElForModal.focus === 'function') {
            _lastActiveElForModal.focus();
            _lastActiveElForModal = null;
        }
    }

    // Clear all filters
    function clearFilters() {
        filters = {
            search: '',
            fandom: '',
            gender: '',
            hairColors: [],
            clothesColors: [],
            parts: [],
            id: ''
        };
        if (idMinInput) idMinInput.value = '';
        if (idMaxInput) idMaxInput.value = '';
        fandomFilter.value = '';
        genderFilter.value = '';
        filters.idMin = '';
        filters.idMax = ''; 
        
        // Clear all checkbox states
        hairColorFilters.innerHTML = '';
        clothesColorFilters.innerHTML = '';
        partsFilters.innerHTML = '';
        
        // Re-render filters to generate fresh checkboxes
        renderFilters();
        renderCatalog();
    }

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Attach event listeners
    function attachEventListeners() {
        // Language change
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                Translations.setLanguage(e.target.value);
                document.documentElement.lang = e.target.value;
            });
        }

        // DX mode select
        if (dxModeSelect) {
            dxModeSelect.addEventListener('change', (e) => {
                dxMode = e.target.value;
                saveDXModePreference();
                renderCatalog();
            });
        }

        // Search with debounce
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                filters.search = e.target.value;
                renderCatalog();
            }, 300));
        }

        // Fandom filter
        if (fandomFilter) {
            fandomFilter.addEventListener('change', (e) => {
                filters.fandom = e.target.value;
                renderCatalog();
            });
        }

        // Gender filter
        if (genderFilter) {
            genderFilter.addEventListener('change', (e) => {
                filters.gender = e.target.value;
                renderCatalog();
            });
        }



        // ID min / max filters
        if (idMinInput) {
            idMinInput.addEventListener('input', debounce((e) => {
                filters.idMin = e.target.value;
                renderCatalog();
            }, 300));
        }
        if (idMaxInput) {
            idMaxInput.addEventListener('input', debounce((e) => {
                filters.idMax = e.target.value;
                renderCatalog();
            }, 300));
        }

        // Checkbox filters
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const name = e.target.name;
                const value = e.target.value;
                const checked = e.target.checked;

                if (name === 'hairColor') {
                    updateArrayFilter(filters.hairColors, value, checked);
                } else if (name === 'clothesColor') {
                    updateArrayFilter(filters.clothesColors, value, checked);
                } else if (name === 'parts') {
                    updateArrayFilter(filters.parts, value, checked);
                }
                renderCatalog();
            }
        });

        // Clear filters
        clearFiltersBtn.addEventListener('click', clearFilters);

        // Modal close
        if (modalClose) modalClose.addEventListener('click', hideModal);
        // Remove modal-specific click handler and use a global click listener for robustness
        // Global click listener: if user clicks outside modal-content of an active modal, close it
        document.addEventListener('click', (e) => {
            // Preview modal check
            const preview = document.getElementById('export-preview-modal');
            if (preview && preview.classList.contains('active')) {
                if (!e.target.closest('#export-preview-modal .modal-content')) {
                    if (typeof closeExportPreview === 'function') closeExportPreview();
                    return;
                }
                return;
            }

            // Detail modal check
            if (modal && modal.classList.contains('active')) {
                if (!e.target.closest('#nendoroid-modal .modal-content')) {
                    hideModal();
                }
            }
        }, true);

        // Global Escape handler (capture phase): support multiple key values for broad browser compatibility
        document.addEventListener('keydown', (e) => {
            const isEsc = e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27;
            if (!isEsc) return;
            const preview = document.getElementById('export-preview-modal');
            if (preview && preview.classList.contains('active')) {
                if (typeof closeExportPreview === 'function') closeExportPreview();
                e.stopPropagation();
                return;
            }
            if (modal && modal.classList.contains('active')) {
                hideModal();
                e.stopPropagation();
            }
        }, true);
    }

    // Update array filter
    function updateArrayFilter(array, value, checked) {
        const index = array.indexOf(value);
        if (checked && index === -1) {
            array.push(value);
        } else if (!checked && index !== -1) {
            array.splice(index, 1);
        }
    }

    // Start the app
    init();
})();
