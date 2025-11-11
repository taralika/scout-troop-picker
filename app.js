// Troop Data - Loaded from external JSON file
let troopData = [];

// State management
let currentSort = { column: null, ascending: true };
let userPreferences = {};
let userLocation = null;
let searchTerms = [];
let searchDebounceTimer = null;

// Load troop data and initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    initializeTheme();
    await loadTroopData();
    renderTable();
    setupEventListeners();
    loadSavedAddress();
});

// Load troop data from JSON file
async function loadTroopData() {
    try {
        const response = await fetch('troopData.json');
        troopData = await response.json();
    } catch (error) {
        console.error('Error loading troop data:', error);
        alert('Error loading troop data. Please refresh the page.');
    }
}

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Tab Management
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active state from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active', 'text-scout-blue', 'dark:text-scout-gold', 'border-scout-blue', 'dark:border-scout-gold');
        button.classList.add('text-gray-600', 'dark:text-gray-400');
    });
    
    // Show selected tab content
    document.getElementById(`content-${tabName}`).classList.remove('hidden');
    
    // Activate selected tab button
    const activeButton = document.getElementById(`tab-${tabName}`);
    activeButton.classList.add('active', 'text-scout-blue', 'dark:text-scout-gold', 'border-scout-blue', 'dark:border-scout-gold');
    activeButton.classList.remove('text-gray-600', 'dark:text-gray-400');
    
    // Reset search when switching away from compare tab
    if (tabName !== 'compare') {
        const input = document.getElementById('search-input');
        const container = document.getElementById('search-bar-container');
        if (input && container) {
            input.value = '';
            searchTerms = [];
            container.classList.remove('visible');
            container.classList.add('hidden');
        }
    }
}

// Search Functions
function toggleSearchBar() {
    const container = document.getElementById('search-bar-container');
    const input = document.getElementById('search-input');
    const isVisible = container.classList.contains('visible');
    
    if (isVisible) {
        container.classList.remove('visible');
        setTimeout(() => container.classList.add('hidden'), 300);
    } else {
        container.classList.remove('hidden');
        setTimeout(() => {
            container.classList.add('visible');
            input.focus();
        }, 10);
    }
}

function handleSearchInput(e) {
    const query = e.target.value.trim();
    
    // Clear previous timeout
    clearTimeout(searchDebounceTimer);
    
    // Debounce search (wait 200ms after user stops typing)
    searchDebounceTimer = setTimeout(() => {
        if (query.length === 0) {
            searchTerms = [];
            renderTable();
        } else if (query.length >= 3) {
            // Parse search query: remove separators and filler words
            searchTerms = parseSearchQuery(query);
            
            if (searchTerms.length > 0) {
                const filteredTroops = filterTroops(searchTerms);
                renderTable(filteredTroops, searchTerms);
            } else {
                // If no valid terms after parsing, show all
                searchTerms = [];
                renderTable();
            }
        }
    }, 200);
}

function parseSearchQuery(query) {
    // List of filler words to ignore
    const fillerWords = ['and', 'or', 'the', 'a', 'an', 'with', 'for', 'to', 'in', 'on', 'at'];
    
    // Replace common separators with spaces
    const cleaned = query.toLowerCase()
        .replace(/[,;:]/g, ' ')  // Replace commas, semicolons, colons with spaces
        .replace(/&/g, ' ')       // Replace ampersand with space
        .trim();
    
    // Split by whitespace, trim, filter empty strings and filler words
    const terms = cleaned
        .split(/\s+/)
        .map(term => term.trim())
        .filter(term => term.length > 0 && !fillerWords.includes(term));
    
    return terms;
}

function clearSearch() {
    const input = document.getElementById('search-input');
    input.value = '';
    searchTerms = [];
    renderTable();
    input.focus();
}

function handleSearchBlur(e) {
    // Small delay to allow clicking clear button
    setTimeout(() => {
        const container = document.getElementById('search-bar-container');
        const input = document.getElementById('search-input');
        
        // Only hide if search is empty and not refocusing
        if (input.value.trim().length === 0 && document.activeElement !== input) {
            container.classList.remove('visible');
            setTimeout(() => container.classList.add('hidden'), 300);
        }
    }, 150);
}

function handleSearchKeydown(e) {
    if (e.key === 'Escape') {
        clearSearch();
        const container = document.getElementById('search-bar-container');
        container.classList.remove('visible');
        setTimeout(() => container.classList.add('hidden'), 300);
    }
}

function extractSearchableText(troop) {
    // Recursively extract all string values from troop object
    const values = [];
    
    function extract(obj) {
        if (typeof obj === 'string') {
            values.push(obj.toLowerCase());
        } else if (typeof obj === 'number') {
            values.push(String(obj));
        } else if (Array.isArray(obj)) {
            obj.forEach(item => extract(item));
        } else if (typeof obj === 'object' && obj !== null) {
            Object.values(obj).forEach(value => extract(value));
        }
    }
    
    extract(troop);
    return values.join(' ');
}

function filterTroops(terms) {
    if (!terms || terms.length === 0) {
        return troopData;
    }
    
    return troopData.filter(troop => {
        const searchableText = extractSearchableText(troop);
        // AND logic: all terms must be present
        return terms.every(term => searchableText.includes(term));
    });
}

function highlightMatches(text, terms) {
    if (!text || !terms || terms.length === 0) {
        return text;
    }
    
    let result = String(text);
    
    // Sort terms by length (longest first) to avoid partial replacements
    const sortedTerms = [...terms].sort((a, b) => b.length - a.length);
    
    sortedTerms.forEach(term => {
        // Create regex for case-insensitive matching
        const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
        result = result.replace(regex, '<mark>$1</mark>');
    });
    
    return result;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Distance Modal Functions
function openDistanceModal() {
    document.getElementById('distance-modal').classList.remove('hidden');
}

function openDistanceModalMobile() {
    // Same as desktop, just a mobile-friendly alias
    openDistanceModal();
}

function closeDistanceModal() {
    document.getElementById('distance-modal').classList.add('hidden');
}

// Flyer Lightbox Functions
function openFlyerLightbox(imagePath) {
    const lightbox = document.getElementById('flyer-lightbox');
    const image = document.getElementById('flyer-lightbox-image');
    image.src = imagePath;
    lightbox.classList.remove('hidden');
    // Add keyboard listener for ESC key
    document.addEventListener('keydown', handleFlyerLightboxEscape);
}

function closeFlyerLightbox() {
    const lightbox = document.getElementById('flyer-lightbox');
    lightbox.classList.add('hidden');
    // Remove keyboard listener
    document.removeEventListener('keydown', handleFlyerLightboxEscape);
}

function handleFlyerLightboxEscape(e) {
    if (e.key === 'Escape') {
        closeFlyerLightbox();
    }
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('calculate-distance').addEventListener('click', calculateDistances);
    document.getElementById('apply-filters').addEventListener('click', applyFiltersAndRecommend);
    document.getElementById('close-modal').addEventListener('click', closeEditModal);
    
    // Tab switching
    document.getElementById('tab-compare').addEventListener('click', () => switchTab('compare'));
    document.getElementById('tab-picker').addEventListener('click', () => switchTab('picker'));
    document.getElementById('tab-about').addEventListener('click', () => switchTab('about'));
    
    // Distance modal
    document.getElementById('open-distance-modal').addEventListener('click', openDistanceModal);
    document.getElementById('close-distance-modal').addEventListener('click', closeDistanceModal);
    
    // Flyer lightbox
    document.getElementById('close-flyer-lightbox').addEventListener('click', closeFlyerLightbox);
    document.getElementById('flyer-lightbox').addEventListener('click', (e) => {
        if (e.target.id === 'flyer-lightbox') {
            closeFlyerLightbox();
        }
    });
    
    // Sort headers
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sort;
            sortTable(sortKey);
        });
    });
    
    // Edit modal - GitHub submission
    document.getElementById('submit-github').addEventListener('click', submitToGitHub);
    
    // Edit modal - Email fallback
    document.getElementById('use-email-fallback').addEventListener('click', showEmailFallback);
    document.getElementById('back-to-github').addEventListener('click', showGitHubView);
    
    // Form submission (email fallback)
    document.getElementById('edit-form-email').addEventListener('submit', handleFormSubmit);
    
    // Close modals on backdrop click
    document.getElementById('edit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'edit-modal') {
            closeEditModal();
        }
    });
    
    document.getElementById('distance-modal').addEventListener('click', (e) => {
        if (e.target.id === 'distance-modal') {
            closeDistanceModal();
        }
    });
    
    // Address autocomplete
    setupAddressAutocomplete();
    
    // Search functionality
    document.getElementById('search-toggle').addEventListener('click', toggleSearchBar);
    document.getElementById('search-input').addEventListener('input', handleSearchInput);
    document.getElementById('search-clear').addEventListener('click', clearSearch);
    document.getElementById('search-input').addEventListener('blur', handleSearchBlur);
    document.getElementById('search-input').addEventListener('keydown', handleSearchKeydown);
    
    // Mobile sort dropdown
    document.getElementById('mobile-sort').addEventListener('change', handleMobileSort);
}

// Address Autocomplete with Photon
let autocompleteTimeout;
function setupAddressAutocomplete() {
    const input = document.getElementById('user-address');
    const dropdown = createAutocompleteDropdown();
    
    input.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        clearTimeout(autocompleteTimeout);
        
        if (query.length < 3) {
            dropdown.classList.add('hidden');
            return;
        }
        
        // Debounce API calls (wait 300ms after user stops typing)
        autocompleteTimeout = setTimeout(() => {
            fetchAddressSuggestions(query, dropdown);
        }, 300);
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== input) {
            dropdown.classList.add('hidden');
        }
    });
}

function createAutocompleteDropdown() {
    const dropdown = document.createElement('div');
    dropdown.id = 'address-autocomplete';
    dropdown.className = 'hidden absolute top-full left-0 right-0 z-50 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto';
    
    const input = document.getElementById('user-address');
    input.parentElement.appendChild(dropdown);
    
    return dropdown;
}

async function fetchAddressSuggestions(query, dropdown) {
    try {
        // Photon API - free, no API key required
        const response = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
        );
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            displaySuggestions(data.features, dropdown);
        } else {
            dropdown.classList.add('hidden');
        }
    } catch (error) {
        console.error('Autocomplete error:', error);
        dropdown.classList.add('hidden');
    }
}

function displaySuggestions(features, dropdown) {
    dropdown.innerHTML = features.map(feature => {
        const props = feature.properties;
        
        // Build address in standard US format: "123 Main St, San Ramon, CA 94582"
        let streetAddress = '';
        if (props.housenumber && props.street) {
            streetAddress = `${props.housenumber} ${props.street}`;
        } else if (props.street) {
            streetAddress = props.street;
        } else if (props.name) {
            streetAddress = props.name;
        }
        
        const cityStateZip = [props.city, props.state, props.postcode].filter(Boolean).join(' ');
        
        const displayText = [streetAddress, cityStateZip].filter(Boolean).join(', ');
        
        return `
            <div class="autocomplete-item px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                 data-address="${displayText}">
                <div class="font-medium">${displayText}</div>
            </div>
        `;
    }).join('');
    
    dropdown.classList.remove('hidden');
    
    // Add click handlers to suggestions
    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            const address = item.dataset.address;
            document.getElementById('user-address').value = address;
            dropdown.classList.add('hidden');
        });
    });
}

// Helper function to get special programs list
function getSpecialProgramsList(troop) {
    if (!troop.specializedPrograms) return '—';
    const programs = Object.keys(troop.specializedPrograms)
        .map(key => {
            // Convert camelCase to Title Case
            return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        });
    return programs.length > 0 ? programs.join(', ') : '—';
}

// Helper function to truncate text
function truncateText(text, maxLength = 100) {
    if (!text) return '—';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Helper function to escape text for HTML onclick attributes
function escapeForOnclick(text) {
    if (text === null || text === undefined) return '';
    // Convert to string if not already
    const str = String(text);
    return str
        .replace(/\\/g, '\\\\')     // Escape backslashes
        .replace(/'/g, "\\'")        // Escape single quotes
        .replace(/"/g, '&quot;')     // Replace double quotes with HTML entity
        .replace(/\n/g, '\\n')       // Escape newlines
        .replace(/\r/g, '\\r')       // Escape carriage returns
        .replace(/\t/g, '\\t');      // Escape tabs
}

// Helper function to get PIP hours (returns numeric value)
function getPIPHoursNumeric(troop) {
    if (!troop.parentInvolvement) return 0;
    if (typeof troop.parentInvolvement === 'object') {
        if (troop.parentInvolvement.volunteerHoursRequired) {
            return troop.parentInvolvement.volunteerHoursRequired;
        }
        if (troop.parentInvolvement.hoursRequired) {
            return troop.parentInvolvement.hoursRequired;
        }
    }
    return 0;
}

// Helper function to display PIP hours
function getPIPHoursDisplay(hours) {
    return hours > 0 ? `${hours} hours` : '0';
}

// Helper function to create detail row content
function createDetailContent(troop, highlightTerms = []) {
    const sections = [];
    const highlight = (text) => highlightTerms.length > 0 ? highlightMatches(text, highlightTerms) : text;
    
    // Flyer Preview (if available)
    if (troop.flyerImage) {
        sections.push(`
            <div class="detail-section">
                <div class="detail-label">📄 Recruiting Flyer</div>
                <div class="cursor-pointer hover:opacity-90 transition-opacity" onclick="openFlyerLightbox('${troop.flyerImage}')">
                    <img src="${troop.flyerImage}" alt="Troop ${troop.troop} Flyer" style="max-width: 180px; width: auto; height: auto;" class="rounded-lg shadow-md hover:shadow-lg border-2 border-gray-200 dark:border-gray-600">
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1.5">↗ Click to view full size</p>
                </div>
            </div>
        `);
    }
    
    // Philosophy/Approach
    if (troop.philosophyApproach) {
        sections.push(`
            <div class="detail-section">
                <div class="detail-label">
                    🎯 Philosophy & Approach
                    <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Philosophy & Approach', '${escapeForOnclick(troop.philosophyApproach)}')">✏️</span>
                </div>
                <div class="text-sm">${highlight(troop.philosophyApproach)}</div>
            </div>
        `);
    }
    
    // Activity Frequency
    if (troop.activityFrequency) {
        sections.push(`
            <div class="detail-section">
                <div class="detail-label">
                    📅 Activity Frequency
                    <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Activity Frequency', '${escapeForOnclick(troop.activityFrequency)}')">✏️</span>
                </div>
                <div class="text-sm">${highlight(troop.activityFrequency)}</div>
            </div>
        `);
    }
    
    // Monthly Outings
    if (troop.monthlyOutings) {
        sections.push(`
            <div class="detail-section">
                <div class="detail-label">
                    🏕️ Monthly Outings
                    <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Monthly Outings', '${escapeForOnclick(troop.monthlyOutings)}')">✏️</span>
                </div>
                <div class="text-sm">${highlight(troop.monthlyOutings)}</div>
            </div>
        `);
    }
    
    // Regular Activities
    if (troop.regularActivities) {
        sections.push(`
            <div class="detail-section">
                <div class="detail-label">
                    🎒 Regular Activities
                    <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Regular Activities', '${escapeForOnclick(troop.regularActivities)}')">✏️</span>
                </div>
                <div class="text-sm">${highlight(troop.regularActivities)}</div>
            </div>
        `);
    }
    
    // Specialized Programs (detailed)
    if (troop.specializedPrograms && Object.keys(troop.specializedPrograms).length > 0) {
        const programDetails = Object.entries(troop.specializedPrograms)
            .map(([key, value]) => {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                const content = typeof value === 'string' ? value : (value === true ? 'Available' : JSON.stringify(value));
                return `<li><strong>${highlight(label)}:</strong> ${highlight(content)}</li>`;
            }).join('');
        
        // Escape the JSON string properly for HTML attribute
        const escapedPrograms = JSON.stringify(troop.specializedPrograms)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '&quot;')
            .replace(/\n/g, '\\n');
        
        sections.push(`
            <div class="detail-section">
                <div class="detail-label">
                    ⚡ Specialized Programs
                    <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Specialized Programs', '${escapedPrograms}')">✏️</span>
                </div>
                <ul class="text-sm list-disc list-inside ml-2">${programDetails}</ul>
            </div>
        `);
    }
    
    // High Adventure (detailed)
    if (troop.highAdventure) {
        sections.push(`
            <div class="detail-section">
                <div class="detail-label">
                    🏔️ High Adventure Programs
                    <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'High Adventure Programs', '${escapeForOnclick(troop.highAdventure)}')">✏️</span>
                </div>
                <div class="text-sm">${highlight(troop.highAdventure)}</div>
            </div>
        `);
    }
    
    // Summer Camps
    if (troop.summerCamps) {
        sections.push(`
            <div class="detail-section">
                <div class="detail-label">
                    ☀️ Summer Camps
                    <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Summer Camps', '${escapeForOnclick(troop.summerCamps)}')">✏️</span>
                </div>
                <div class="text-sm">${highlight(troop.summerCamps)}</div>
            </div>
        `);
    }
    
    // Leadership Structure
    if (troop.leadershipStructure) {
        sections.push(`
            <div class="detail-section">
                <div class="detail-label">
                    👥 Leadership Structure
                    <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Leadership Structure', '${escapeForOnclick(troop.leadershipStructure)}')">✏️</span>
                </div>
                <div class="text-sm">${highlight(troop.leadershipStructure)}</div>
            </div>
        `);
    }
    
    // Dues
    if (troop.dues) {
        sections.push(`
            <div class="detail-section">
                <div class="detail-label">
                    💰 Annual Dues
                    <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Annual Dues', '${escapeForOnclick(troop.dues)}')">✏️</span>
                </div>
                <div class="text-sm">${highlight(troop.dues)}</div>
            </div>
        `);
    }
    
    // Parent Involvement
    if (troop.parentInvolvement) {
        if (typeof troop.parentInvolvement === 'string') {
            sections.push(`
                <div class="detail-section">
                    <div class="detail-label">
                        👨‍👩‍👧‍👦 Parent Involvement
                        <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Parent Involvement', '${escapeForOnclick(troop.parentInvolvement)}')">✏️</span>
                    </div>
                    <div class="text-sm">${highlight(troop.parentInvolvement)}</div>
                </div>
            `);
        } else if (typeof troop.parentInvolvement === 'object') {
            const piDetails = Object.entries(troop.parentInvolvement)
                .map(([key, value]) => {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return `<li><strong>${highlight(label)}:</strong> ${highlight(String(value))}</li>`;
                }).join('');
            
            // Escape the JSON string properly for HTML attribute
            const escapedPI = JSON.stringify(troop.parentInvolvement)
                .replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'")
                .replace(/"/g, '&quot;')
                .replace(/\n/g, '\\n');
            
            sections.push(`
                <div class="detail-section">
                    <div class="detail-label">
                        👨‍👩‍👧‍👦 Parent Involvement Program (PIP)
                        <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Parent Involvement', '${escapedPI}')">✏️</span>
                    </div>
                    <ul class="text-sm list-disc list-inside ml-2">${piDetails}</ul>
                </div>
            `);
        }
    }
    
    // Eagle Scout Retention
    if (troop.eagleScoutRetention) {
        sections.push(`
            <div class="detail-section">
                <div class="detail-label">
                    🦅 Eagle Scout Retention
                    <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Eagle Scout Retention', '${escapeForOnclick(troop.eagleScoutRetention)}')">✏️</span>
                </div>
                <div class="text-sm">${highlight(troop.eagleScoutRetention)}</div>
            </div>
        `);
    }
    
    // Adult Leaders
    if (troop.adultLeaders) {
        sections.push(`
            <div class="detail-section">
                <div class="detail-label">
                    👔 Adult Leadership
                    <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Adult Leadership', '${escapeForOnclick(troop.adultLeaders)}')">✏️</span>
                </div>
                <div class="text-sm">${highlight(troop.adultLeaders)}</div>
            </div>
        `);
    }
    
    // Reputation
    if (troop.reputation) {
        sections.push(`
            <div class="detail-section">
                <div class="detail-label">
                    ⭐ Reputation & Unique Aspects
                    <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Reputation & Unique Aspects', '${escapeForOnclick(troop.reputation)}')">✏️</span>
                </div>
                <div class="text-sm">${highlight(troop.reputation)}</div>
            </div>
        `);
    }
    
    // Unique Selling Points
    if (troop.uniqueSellingPoints) {
        // Convert newlines to <br> for better formatting, then apply highlighting
        const formattedUSP = highlight(troop.uniqueSellingPoints.replace(/\n/g, '<br>'));
        sections.push(`
            <div class="detail-section">
                <div class="detail-label">
                    💎 Key Highlights
                    <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Key Highlights', '${escapeForOnclick(troop.uniqueSellingPoints)}')">✏️</span>
                </div>
                <div class="text-sm">${formattedUSP}</div>
            </div>
        `);
    }
    
    // Notes
    if (troop.notes) {
        sections.push(`
            <div class="detail-section">
                <div class="detail-label">
                    📝 Additional Notes
                    <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Additional Notes', '${escapeForOnclick(troop.notes)}')">✏️</span>
                </div>
                <div class="text-sm">${highlight(troop.notes)}</div>
            </div>
        `);
    }
    
    // Tags
    if (troop.tags && troop.tags.length > 0) {
        const tagBadges = troop.tags.map(tag => 
            `<span class="badge bg-scout-blue/10 text-scout-blue dark:bg-scout-gold/10 dark:text-scout-gold">${tag}</span>`
        ).join(' ');
        sections.push(`
            <div class="detail-section">
                <div>${tagBadges}</div>
            </div>
        `);
    }
    
    // Detailed Contact Info
    if (troop.contactMore) {
        // Convert newlines to <br> for better formatting, then apply highlighting
        const formattedContact = highlight(troop.contactMore.replace(/\n/g, '<br>'));
        sections.push(`
            <div class="detail-section">
                <div class="detail-label">
                    📞 Detailed Contact Information
                    <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Detailed Contact Information', '${escapeForOnclick(troop.contactMore)}')">✏️</span>
                </div>
                <div class="text-sm">${formattedContact}</div>
            </div>
        `);
    }
    
    // Website Link
    sections.push(`
        <div class="detail-section">
            <a href="${troop.website}" target="_blank" class="inline-block px-4 py-2 bg-scout-blue dark:bg-scout-gold text-white dark:text-gray-900 rounded hover:opacity-90 transition-opacity">
                Visit Website →
            </a>
        </div>
    `);
    
    return sections.join('');
}

// Render Table
function renderTable(troops = troopData, highlightTerms = []) {
    // Apply current sort if one exists
    let displayTroops = troops;
    if (currentSort.column) {
        displayTroops = applySorting([...troops], currentSort.column, currentSort.ascending);
    }
    
    // Render both table and card views
    renderTableView(displayTroops, highlightTerms);
    renderCardView(displayTroops, highlightTerms);
    
    // Update sort indicators
    updateSortIndicators();
}

function renderTableView(troops = troopData, highlightTerms = []) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    
    // Handle no results
    if (troops.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="14" class="no-results-message">
                    <div class="text-lg font-semibold mb-2">No troops found</div>
                    <div class="text-sm">Try adjusting your search terms or clearing the search</div>
                </td>
            </tr>
        `;
        return;
    }
    
    troops.forEach((troop, index) => {
        // Add pipHours as numeric property for sorting
        troop.pipHours = getPIPHoursNumeric(troop);
        
        // Main row
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700/50';
        row.dataset.troopId = troop.troop;
        row.dataset.expandId = `expand-${index}`;
        
        const specialPrograms = getSpecialProgramsList(troop);
        const highAdventureDisplay = troop.highAdventureShort || truncateText(troop.highAdventure, 80);
        const pipHoursDisplay = getPIPHoursDisplay(troop.pipHours);
        
        // Apply highlighting if search is active
        const highlight = (text) => highlightTerms.length > 0 ? highlightMatches(text, highlightTerms) : text;
        
        row.innerHTML = `
            <td class="px-2 py-3 text-center">
                <span class="expand-icon text-xl cursor-pointer" data-index="${index}" onclick="toggleExpand(${index})">▶</span>
            </td>
            <td class="px-4 py-3 font-semibold text-scout-blue dark:text-scout-gold">
                <a href="${troop.website}" target="_blank" class="hover:underline">Troop ${highlight(troop.troop)}</a>
                ${troop.flyerImage ? `<span class="ml-2 cursor-pointer hover:scale-110 transition-transform inline-block" onclick="openFlyerLightbox('${troop.flyerImage}')" title="View recruiting flyer">📄</span>` : ''}
            </td>
            <td class="px-4 py-3">
                <span class="distance-value">${troop.distance !== null ? troop.distance.toFixed(1) + ' mi' : '—'}</span>
            </td>
            <td class="px-4 py-3">
                <div class="font-semibold">${highlight(troop.meetingDay)}</div>
                <div class="text-xs text-gray-600 dark:text-gray-400">${highlight(troop.meetingTime)}</div>
                <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Meeting Day/Time', '${escapeForOnclick((troop.meetingDay || '') + ' ' + (troop.meetingTime || ''))}')">✏️</span>
            </td>
            <td class="px-4 py-3">
                <div class="font-medium">${highlight(troop.location)}</div>
                <div class="text-xs text-gray-600 dark:text-gray-400">${highlight(troop.city)}</div>
                <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Meeting Location', '${escapeForOnclick((troop.location || '') + ', ' + (troop.address || ''))}')">✏️</span>
            </td>
            <td class="px-4 py-3">
                ${highlight(String(troop.founded || '—'))}
                <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Founded Year', '${escapeForOnclick(troop.founded || 'Unknown')}')">✏️</span>
            </td>
            <td class="px-4 py-3">
                ${highlight(typeof troop.size === 'number' ? troop.size + ' scouts' : troop.size)}
                <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Troop Size', '${escapeForOnclick(troop.size)}')">✏️</span>
            </td>
            <td class="px-4 py-3">
                ${highlight(troop.charteredOrg)}
                <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Chartered Organization', '${escapeForOnclick(troop.charteredOrg)}')">✏️</span>
            </td>
            <td class="px-4 py-3">
                <div class="font-semibold text-scout-gold">${highlight(troop.eagleCount + ' scouts')}</div>
                <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Eagle Scouts', '${escapeForOnclick(troop.eagles)}')">✏️</span>
            </td>
            <td class="px-4 py-3 max-w-xs">
                ${highlight(troop.programFocus)}
                <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Program Focus', '${escapeForOnclick(troop.programFocus)}')">✏️</span>
            </td>
            <td class="px-4 py-3 max-w-xs">
                <div class="text-sm">${highlight(specialPrograms)}</div>
                <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Special Programs', '${escapeForOnclick(specialPrograms)}')">✏️</span>
            </td>
            <td class="px-4 py-3 max-w-sm">
                <div class="text-sm">${highlight(highAdventureDisplay)}</div>
                <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'High Adventure', '${escapeForOnclick(troop.highAdventureShort || troop.highAdventure || '')}')">✏️</span>
            </td>
            <td class="px-4 py-3">
                ${highlight(pipHoursDisplay)}
                <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'PIP Hours', '${escapeForOnclick(troop.pipHours)}')">✏️</span>
            </td>
            <td class="px-4 py-3">
                <div class="text-sm">${highlight(truncateText(troop.contact, 50))}</div>
                <a href="${troop.website}" target="_blank" class="text-xs text-scout-blue dark:text-scout-gold hover:underline">Website →</a>
                <span class="edit-icon ml-2" onclick="openEditModal('${troop.troop}', 'Contact Info', '${escapeForOnclick(troop.contact)}')">✏️</span>
            </td>
        `;
        
        // Detail row
        const detailRow = document.createElement('tr');
        detailRow.className = 'detail-row';
        detailRow.dataset.detailId = `detail-${index}`;
        detailRow.innerHTML = `
            <td colspan="14" class="px-0 py-0">
                <div class="detail-content px-6 py-4">
                    ${createDetailContent(troop, highlightTerms)}
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
        tbody.appendChild(detailRow);
    });
}

// Render Card View (Mobile)
function renderCardView(troops = troopData, highlightTerms = []) {
    const cardView = document.getElementById('card-view');
    cardView.innerHTML = '';
    
    // Handle no results
    if (troops.length === 0) {
        cardView.innerHTML = `
            <div class="no-results-message">
                <div class="text-lg font-semibold mb-2">No troops found</div>
                <div class="text-sm">Try adjusting your search terms or clearing the search</div>
            </div>
        `;
        return;
    }
    
    troops.forEach((troop, index) => {
        // Add pipHours as numeric property for sorting
        troop.pipHours = getPIPHoursNumeric(troop);
        
        const specialPrograms = getSpecialProgramsList(troop);
        const highAdventureDisplay = troop.highAdventureShort || truncateText(troop.highAdventure, 80);
        const pipHoursDisplay = getPIPHoursDisplay(troop.pipHours);
        
        // Apply highlighting if search is active
        const highlight = (text) => highlightTerms.length > 0 ? highlightMatches(text, highlightTerms) : text;
        
        const card = document.createElement('div');
        card.className = 'troop-card';
        card.dataset.cardId = `card-${index}`;
        card.dataset.cardTroop = troop.troop;
        
        card.innerHTML = `
            <div class="troop-card-header">
                <div class="troop-card-title">
                    🏕️ <a href="${troop.website}" target="_blank" class="hover:underline">Troop ${highlight(troop.troop)}</a>
                    ${troop.flyerImage ? `<span class="ml-2 cursor-pointer hover:scale-110 transition-transform inline-block" onclick="openFlyerLightbox('${troop.flyerImage}')" title="View recruiting flyer">📄</span>` : ''}
                </div>
            </div>
            
            <div class="troop-card-field">
                <span class="troop-card-label">📍 Distance</span>
                <span class="troop-card-value">
                    ${troop.distance !== null 
                        ? `<span class="distance-clickable" onclick="openDistanceModalMobile()">${troop.distance.toFixed(1)} mi</span>`
                        : `<button class="set-home-btn" onclick="openDistanceModalMobile()">🏠 Set Home</button>`
                    }
                </span>
            </div>
            
            <div class="troop-card-field">
                <span class="troop-card-label">📅 Meeting</span>
                <span class="troop-card-value">
                    ${highlight(troop.meetingDay)} ${highlight(troop.meetingTime)}
                </span>
            </div>
            
            <div class="troop-card-field">
                <span class="troop-card-label">📍 Location</span>
                <span class="troop-card-value">
                    ${highlight(troop.location)}, ${highlight(troop.city)}
                </span>
            </div>
            
            <div class="troop-card-field">
                <span class="troop-card-label">🏛️ Founded</span>
                <span class="troop-card-value">
                    ${highlight(String(troop.founded || '—'))}
                </span>
            </div>
            
            <div class="troop-card-field">
                <span class="troop-card-label">👥 Troop Size</span>
                <span class="troop-card-value">
                    ${highlight(typeof troop.size === 'number' ? troop.size + ' scouts' : troop.size)}
                </span>
            </div>
            
            <div class="troop-card-field">
                <span class="troop-card-label">🏢 Chartered Org</span>
                <span class="troop-card-value">
                    ${highlight(troop.charteredOrg)}
                </span>
            </div>
            
            <div class="troop-card-field">
                <span class="troop-card-label">🦅 Eagle Scouts</span>
                <span class="troop-card-value">
                    ${highlight(troop.eagleCount + ' scouts')}
                </span>
            </div>
            
            <div class="troop-card-field">
                <span class="troop-card-label">🎯 Program Focus</span>
                <span class="troop-card-value">
                    ${highlight(troop.programFocus)}
                </span>
            </div>
            
            <div class="troop-card-field">
                <span class="troop-card-label">⭐ Special Programs</span>
                <span class="troop-card-value">
                    ${highlight(specialPrograms)}
                </span>
            </div>
            
            <div class="troop-card-field">
                <span class="troop-card-label">🏔️ High Adventure</span>
                <span class="troop-card-value">
                    ${highlight(highAdventureDisplay)}
                </span>
            </div>
            
            <div class="troop-card-field">
                <span class="troop-card-label">⏱️ PIP Hours</span>
                <span class="troop-card-value">
                    ${highlight(pipHoursDisplay)}
                </span>
            </div>
            
            <div class="troop-card-field">
                <span class="troop-card-label">📧 Contact</span>
                <span class="troop-card-value">
                    ${highlight(truncateText(troop.contact, 50))}
                </span>
            </div>
            
            <button class="troop-card-edit" onclick="openCardEditModal('${troop.troop}', ${index})">
                ✏️ Suggest an Edit
            </button>
            
            <button class="troop-card-expand" onclick="toggleCardExpand(${index})">
                <span id="card-expand-icon-${index}">▼</span> Show Full Details
            </button>
            
            <div class="troop-card-details" id="card-details-${index}">
                ${createDetailContent(troop, highlightTerms)}
            </div>
        `;
        
        cardView.appendChild(card);
    });
}

// Toggle expand/collapse for card details
function toggleCardExpand(index) {
    const details = document.getElementById(`card-details-${index}`);
    const icon = document.getElementById(`card-expand-icon-${index}`);
    const button = icon.parentElement;
    
    if (details && icon) {
        const isExpanded = details.classList.contains('expanded');
        details.classList.toggle('expanded');
        
        if (isExpanded) {
            icon.textContent = '▼';
            button.innerHTML = '<span id="card-expand-icon-' + index + '">▼</span> Show Full Details';
        } else {
            icon.textContent = '▲';
            button.innerHTML = '<span id="card-expand-icon-' + index + '">▲</span> Hide Details';
        }
    }
}

// Toggle expand/collapse for detail rows (table view)
function toggleExpand(index) {
    const icon = document.querySelector(`[data-expand-id="expand-${index}"] .expand-icon[data-index="${index}"]`);
    const detailRow = document.querySelector(`[data-detail-id="detail-${index}"]`);
    
    if (icon && detailRow) {
        const isExpanded = detailRow.classList.contains('expanded');
        
        // Toggle expanded state
        icon.classList.toggle('expanded');
        detailRow.classList.toggle('expanded');
        
        // Change arrow icon
        icon.textContent = isExpanded ? '▶' : '▼';
    }
}

// Apply sorting to a dataset
function applySorting(data, column, ascending) {
    return data.sort((a, b) => {
        let aVal, bVal;
        
        switch(column) {
            case 'troop':
                aVal = parseInt(a.troop);
                bVal = parseInt(b.troop);
                break;
            case 'distance':
                aVal = a.distance !== null ? a.distance : Infinity;
                bVal = b.distance !== null ? b.distance : Infinity;
                break;
            case 'meetingDay':
                const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Friday': 5 };
                aVal = dayOrder[a.meetingDay] || 0;
                bVal = dayOrder[b.meetingDay] || 0;
                break;
            case 'founded':
                aVal = a.founded || 9999;
                bVal = b.founded || 9999;
                break;
            case 'size':
                aVal = typeof a.size === 'number' ? a.size : 50;
                bVal = typeof b.size === 'number' ? b.size : 50;
                break;
            case 'eagles':
                aVal = a.eagleCount;
                bVal = b.eagleCount;
                break;
            case 'pipHours':
                aVal = a.pipHours !== undefined ? a.pipHours : getPIPHoursNumeric(a);
                bVal = b.pipHours !== undefined ? b.pipHours : getPIPHoursNumeric(b);
                break;
            default:
                return 0;
        }
        
        if (aVal < bVal) return ascending ? -1 : 1;
        if (aVal > bVal) return ascending ? 1 : -1;
        return 0;
    });
}

// Update sort indicators (arrows) in table headers
function updateSortIndicators() {
    // Remove all existing arrow indicators from table headers
    document.querySelectorAll('.sort-arrow').forEach(arrow => arrow.remove());
    
    // Add indicator to current sorted column
    if (currentSort.column) {
        const header = document.querySelector(`[data-sort="${currentSort.column}"]`);
        if (header) {
            const arrow = document.createElement('span');
            arrow.className = 'sort-arrow';
            arrow.textContent = currentSort.ascending ? ' ▲' : ' ▼';
            header.appendChild(arrow);
        }
        
        // Update mobile sort dropdown to match
        const mobileSort = document.getElementById('mobile-sort');
        if (mobileSort) {
            mobileSort.value = currentSort.column;
        }
    }
}

// Sort Table
function sortTable(column) {
    if (currentSort.column === column) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort.column = column;
        currentSort.ascending = true;
    }
    
    // Get current filtered data or all data
    const dataToSort = searchTerms.length > 0 ? filterTroops(searchTerms) : troopData;
    
    // Render with the sort applied (renderTable will apply the sort)
    renderTable(dataToSort, searchTerms);
}

// Handle mobile sort dropdown
function handleMobileSort(e) {
    const column = e.target.value;
    if (column) {
        sortTable(column);
    }
}

// Distance Calculation
// Load saved address and distances from localStorage
function loadSavedAddress() {
    const savedAddress = localStorage.getItem('homeAddress');
    if (savedAddress) {
        document.getElementById('user-address').value = savedAddress;
        
        // Also load saved distances if they exist
        const savedDistances = localStorage.getItem('troopDistances');
        if (savedDistances) {
            try {
                const distances = JSON.parse(savedDistances);
                // Apply saved distances to troopData
                troopData.forEach(troop => {
                    if (distances[troop.troop] !== undefined) {
                        troop.distance = distances[troop.troop];
                    }
                });
                // Re-render table with distances
                renderTable();
            } catch (error) {
                console.error('Error loading saved distances:', error);
            }
        }
    }
}

async function calculateDistances() {
    const address = document.getElementById('user-address').value.trim();
    if (!address) {
        alert('Please enter your address');
        return;
    }
    
    const button = document.getElementById('calculate-distance');
    button.disabled = true;
    button.textContent = 'Calculating...';
    
    try {
        // Geocode user address
        const userCoords = await geocodeAddress(address);
        if (!userCoords) {
            throw new Error('Could not find your address');
        }
        
        userLocation = userCoords;
        
        // Save address to localStorage for future visits
        localStorage.setItem('homeAddress', address);
        
        // Close modal and show spinners in distance columns
        closeDistanceModal();
        showDistanceSpinners();
        
        // Object to store distances keyed by troop number
        const distancesMap = {};
        
        // Calculate distances for each troop
        for (let troop of troopData) {
            const troopCoords = await geocodeAddress(troop.address);
            if (troopCoords) {
                troop.distance = haversineDistance(userCoords, troopCoords);
                distancesMap[troop.troop] = troop.distance;
                // Update this specific row immediately
                updateDistanceInRow(troop.troop, troop.distance);
            }
        }
        
        // Save distances to localStorage
        localStorage.setItem('troopDistances', JSON.stringify(distancesMap));
        
        button.textContent = '✓ Done';
        setTimeout(() => {
            button.textContent = 'Calculate';
            button.disabled = false;
        }, 2000);
        
    } catch (error) {
        alert('Error calculating distances: ' + error.message);
        button.textContent = 'Calculate';
        button.disabled = false;
        renderTable(); // Reset table on error
    }
}

function showDistanceSpinners() {
    // Update desktop table view
    document.querySelectorAll('.distance-value').forEach(cell => {
        cell.innerHTML = '<span class="spinner">⏳</span>';
    });
    
    // Update mobile card view
    document.querySelectorAll('.troop-card').forEach(card => {
        const fields = card.querySelectorAll('.troop-card-field');
        fields.forEach(field => {
            const label = field.querySelector('.troop-card-label');
            if (label && label.textContent.includes('Distance')) {
                const valueSpan = field.querySelector('.troop-card-value');
                if (valueSpan) {
                    valueSpan.innerHTML = '<span class="spinner">⏳</span>';
                }
            }
        });
    });
}

function updateDistanceInRow(troopNumber, distance) {
    // Update desktop table view
    const row = document.querySelector(`tr[data-troop-id="${troopNumber}"]`);
    if (row) {
        const distanceCell = row.querySelector('.distance-value');
        if (distanceCell && distance !== null) {
            distanceCell.textContent = distance.toFixed(1) + ' mi';
        }
    }
    
    // Update mobile card view
    const card = document.querySelector(`.troop-card[data-card-troop="${troopNumber}"]`);
    if (card && distance !== null) {
        const fields = card.querySelectorAll('.troop-card-field');
        fields.forEach(field => {
            const label = field.querySelector('.troop-card-label');
            if (label && label.textContent.includes('Distance')) {
                const valueSpan = field.querySelector('.troop-card-value');
                if (valueSpan) {
                    valueSpan.innerHTML = `<span class="distance-clickable" onclick="openDistanceModalMobile()">${distance.toFixed(1)} mi</span>`;
                }
            }
        });
    }
}

// Geocoding using Nominatim (OpenStreetMap)
async function geocodeAddress(address) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
            { headers: { 'User-Agent': 'ScoutTroopFinder/1.0' } }
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

// Haversine Distance Formula (in miles)
function haversineDistance(coords1, coords2) {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lon - coords1.lon);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(degrees) {
    return degrees * Math.PI / 180;
}

// Preferences and Recommendations
function applyFiltersAndRecommend() {
    // Gather preferences
    userPreferences = {
        meetingDay: document.getElementById('pref-meeting-day').value,
        maxDistance: parseFloat(document.getElementById('pref-max-distance').value),
        activity: document.getElementById('pref-activity').value,
        size: document.getElementById('pref-size').value,
        experience: document.getElementById('pref-experience').value,
        personality: document.getElementById('pref-personality').value
    };
    
    // Check if user has set distance preference but hasn't calculated distances
    if (userPreferences.maxDistance < 999) {
        const hasDistances = troopData.some(troop => troop.distance !== null);
        if (!hasDistances) {
            alert('Please calculate distances from your home address first to use distance preferences.');
            openDistanceModal();
            return;
        }
    }
    
    // Score each troop
    const scoredTroops = troopData.map(troop => {
        let score = 0;
        let reasons = [];
        
        // Meeting day match (PRIMARY PREFERENCE)
        if (userPreferences.meetingDay) {
            if (troop.meetingDay === userPreferences.meetingDay) {
                score += 20;
                reasons.push(`Meets on ${userPreferences.meetingDay}s as preferred`);
            } else {
                score -= 5;
                reasons.push(`⚠️ Meets on ${troop.meetingDay}s (you preferred ${userPreferences.meetingDay})`);
            }
        }
        
        // Distance filter (PRIMARY PREFERENCE)
        if (troop.distance !== null && userPreferences.maxDistance < 999) {
            if (troop.distance <= userPreferences.maxDistance) {
                score += 15;
                reasons.push(`Within your ${userPreferences.maxDistance} mile radius (${troop.distance.toFixed(1)} mi away)`);
            } else {
                score -= 10;
                reasons.push(`⚠️ ${troop.distance.toFixed(1)} miles away (beyond your ${userPreferences.maxDistance} mile preference)`);
            }
        }
        
        // Activity focus (PRIMARY PREFERENCE)
        if (userPreferences.activity && troop.tags && troop.scoutAttributes) {
            if (userPreferences.activity === 'outdoor') {
                if (troop.tags.includes('outdoor')) {
                    score += 25;
                    reasons.push('Strong outdoor & adventure program matches your interest');
                } else {
                    score -= 8;
                }
            } else if (userPreferences.activity === 'eagle') {
                if (troop.tags.includes('eagle')) {
                    score += 25;
                    reasons.push(`Excellent Eagle Scout track record (${troop.eagles})`);
                } else {
                    score -= 8;
                }
            } else if (userPreferences.activity === 'balanced') {
                if (troop.scoutAttributes.balanced >= 4) {
                    score += 20;
                    reasons.push('Well-balanced program combining advancement, activities, and life skills');
                } else {
                    score -= 8;
                }
            }
        }
        
        // Size preference (PRIMARY PREFERENCE)
        if (userPreferences.size) {
            if (userPreferences.size === troop.sizeCategory) {
                score += 15;
                reasons.push(`${capitalizeFirst(troop.sizeCategory)} troop size matches your preference`);
            } else {
                score -= 10;
                reasons.push(`⚠️ ${capitalizeFirst(troop.sizeCategory)} troop (you preferred ${userPreferences.size})`);
            }
        }
        
        // Experience level (PRIMARY PREFERENCE)
        if (userPreferences.experience && troop.scoutAttributes) {
            if (userPreferences.experience === 'new') {
                if (troop.scoutAttributes.newScoutFriendly >= 4) {
                    score += 15;
                    reasons.push('Excellent program for new scouts bridging from Cub Scouts');
                }
            } else if (userPreferences.experience === 'experienced') {
                // Experienced scouts may prefer larger troops with more leadership opportunities
                if (troop.tags && troop.tags.includes('boy-led')) {
                    score += 10;
                    reasons.push('Scout-led program offers advanced leadership opportunities');
                }
                if (troop.tags && troop.tags.includes('high-adventure')) {
                    score += 8;
                    reasons.push('High adventure opportunities for experienced scouts');
                }
            }
        }
        
        // Personality fit
        if (userPreferences.personality) {
            if (userPreferences.personality === 'cautious' && troop.sizeCategory === 'small') {
                score += 10;
                reasons.push('Smaller, more intimate troop environment may be comfortable for thoughtful scouts');
            } else if (userPreferences.personality === 'confident' && troop.tags && troop.tags.includes('boy-led')) {
                score += 10;
                reasons.push('Scout-led program provides leadership opportunities for confident scouts');
            }
        }
        
        // Special attributes
        if (troop.tags && troop.tags.includes('high-adventure') && userPreferences.activity === 'outdoor') {
            score += 10;
            reasons.push('Offers high adventure opportunities (Philmont, Northern Tier, etc.)');
        }
        
        // Specialized programs bonus
        if (troop.specializedPrograms) {
            if (troop.specializedPrograms.cycling && userPreferences.activity === 'outdoor') {
                score += 8;
                reasons.push('🚴 Comprehensive cycling merit badge program');
            }
            if (troop.specializedPrograms.backpacking && userPreferences.activity === 'outdoor') {
                score += 8;
                reasons.push('🎒 Extensive backpacking program with practice hikes');
            }
            if (troop.specializedPrograms.snowCamping && userPreferences.activity === 'outdoor') {
                score += 5;
                reasons.push('❄️ Unique snow camping and winter adventure program');
            }
        }
        
        // Activity frequency bonus
        if (troop.activityFrequency && typeof troop.activityFrequency === 'string' && 
            troop.activityFrequency.includes('35') && userPreferences.activity === 'outdoor') {
            score += 10;
            reasons.push('🏕️ Extremely active with ~35 outings per year');
        }
        
        // PIP program info (neutral, just informative)
        if (troop.parentInvolvement && typeof troop.parentInvolvement === 'object' && troop.parentInvolvement.pipProgram) {
            reasons.push(`ℹ️ Parent Involvement Program: $${troop.parentInvolvement.pipDeposit} deposit (refundable with ${troop.parentInvolvement.pipHoursRequired} volunteer hours)`);
        }
        
        // New scout program bonus
        if (troop.specializedPrograms && troop.specializedPrograms.newScoutProgram && userPreferences.experience === 'new') {
            score += 10;
            reasons.push('🆕 Comprehensive new scout program with dedicated guides and advancement support');
        }
        
        // Quality Unit Award bonus
        if (troop.tags && troop.tags.includes('quality-unit')) {
            score += 5;
            reasons.push('🏆 Quality Unit Award recipient - recognized for excellence');
        }
        
        // Wolfeboro/summer camp specialties
        if (troop.specializedPrograms && troop.specializedPrograms.summerCampSpecialties && userPreferences.activity === 'outdoor') {
            score += 5;
            reasons.push('⛺ Unique summer camp programs (Sourdough, rockers, Pioneer status)');
        }
        
        // Boy-led emphasis bonus
        if (troop.specializedPrograms && troop.specializedPrograms.boyLedEmphasis && userPreferences.personality === 'confident') {
            score += 8;
            reasons.push('👥 Strong boy-led program with leadership opportunities at all ranks');
        }
        
        // Historic/First troop bonus
        if (troop.tags && troop.tags.includes('first-in-san-ramon')) {
            score += 5;
            reasons.push('📜 First troop in San Ramon with 60+ years of rich history and tradition');
        }
        
        // Year-round program
        if (troop.tags && troop.tags.includes('year-round')) {
            score += 3;
            reasons.push('📅 Year-round program including summer meetings');
        }
        
        // Climbing programs
        if (troop.specializedPrograms && troop.specializedPrograms.climbing && userPreferences.activity === 'outdoor') {
            score += 4;
            reasons.push('🧗 Rock climbing program with merit badge opportunities');
        }
        
        // Shooting sports
        if (troop.specializedPrograms && troop.specializedPrograms.shooting && userPreferences.activity === 'outdoor') {
            score += 4;
            reasons.push('🎯 Archery and rifle shooting programs with certified instructors');
        }
        
        // Multiple summer camp options
        if (troop.summerCamps && typeof troop.summerCamps === 'string' && 
            troop.summerCamps.toLowerCase().includes('rotate') && userPreferences.activity === 'outdoor') {
            score += 3;
            reasons.push('🏕️ Multiple summer camp options (rotates between camps)');
        }
        
        // Grand Slam of High Adventure achievement
        if (troop.highAdventure && typeof troop.highAdventure === 'string' && 
            troop.highAdventure.toLowerCase().includes('grand slam') && userPreferences.activity === 'outdoor') {
            score += 10;
            reasons.push('🏆 Scouts have earned Grand Slam of High Adventure (all 4 National High Adventure Bases)');
        }
        
        // Eagle mentoring program (relevant for all, especially experienced)
        if (troop.specializedPrograms && troop.specializedPrograms.eagleMentoring && userPreferences.activity === 'eagle') {
            score += 6;
            reasons.push('🦅 Eagle Scout Advisors mentor Life Scouts through Eagle process');
        }
        
        // Multiple backpacking trips
        if (troop.specializedPrograms && troop.specializedPrograms.backpacking && 
            typeof troop.specializedPrograms.backpacking === 'string' && 
            troop.specializedPrograms.backpacking.toLowerCase().includes('multiple') && 
            userPreferences.activity === 'outdoor') {
            score += 5;
            reasons.push('🎒 Multiple backpacking trips throughout year for all skill levels');
        }
        
        // Sea Scouting affiliation
        if (troop.specializedPrograms && troop.specializedPrograms.seaScouting && userPreferences.activity === 'outdoor') {
            score += 8;
            reasons.push('⛵ Unique Sea Scout affiliation with sailing and power boating activities');
        }
        
        // Friday meetings (scheduling flexibility) - only if no meeting day preference set
        if (!userPreferences.meetingDay && troop.tags && troop.tags.includes('friday-meetings')) {
            score += 3;
            reasons.push('📅 Friday meetings provide scheduling flexibility');
        }
        
        // Webelos outreach programs (relevant for new scouts)
        if (troop.specializedPrograms && troop.specializedPrograms.webelosOutreach && userPreferences.experience === 'new') {
            score += 4;
            reasons.push('🎯 Strong Webelos outreach program (Aquanaut, Zombie First Aid, Pizza Hike)');
        }
        
        // Catalina Island camp
        if (troop.specializedPrograms && troop.specializedPrograms.catalinaCamp && userPreferences.activity === 'outdoor') {
            score += 7;
            reasons.push('🏝️ Camp Emerald Bay on Catalina Island with water and boating merit badges');
        }
        
        // First-year scout program (relevant for new scouts)
        if (troop.specializedPrograms && troop.specializedPrograms.firstYearProgram && userPreferences.experience === 'new') {
            score += 5;
            reasons.push('🎓 Comprehensive First Year program for new scouts');
        }
        
        // Structured patrol system
        if (troop.specializedPrograms && troop.specializedPrograms.patrolSystem) {
            score += 3;
            reasons.push('👥 Structured patrol system (2 patrols per age level, 8 scouts each)');
        }
        
        if (troop.founded && troop.founded < 1970) {
            score += 5;
            reasons.push(`Established troop with ${new Date().getFullYear() - troop.founded}+ years of tradition`);
        }
        
        return { ...troop, score, reasons };
    });
    
    // Sort by score
    const sortedTroops = scoredTroops.sort((a, b) => b.score - a.score);
    
    // Show recommendations
    showRecommendations(sortedTroops);
}

function showRecommendations(scoredTroops) {
    const recommendationsSection = document.getElementById('recommendations');
    const recommendationsContent = document.getElementById('recommendations-content');
    
    // Get top 3 recommendations
    const topTroops = scoredTroops.slice(0, 3).filter(t => t.score > 0);
    
    if (topTroops.length === 0) {
        recommendationsContent.innerHTML = '<p class="text-gray-600 dark:text-gray-400">No strong matches found with your current preferences. Try adjusting your filters or calculate distances first.</p>';
    } else {
        recommendationsContent.innerHTML = topTroops.map((troop, index) => `
            <div class="recommendation-card bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 shadow-sm">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-3">
                        <div class="text-3xl font-bold text-scout-gold">#${index + 1}</div>
                        <div>
                            <h3 class="text-lg font-bold text-scout-blue dark:text-scout-gold">
                                <a href="${troop.website}" target="_blank" class="hover:underline">Troop ${troop.troop}</a>
                                ${troop.flyerImage ? `<span class="ml-2 cursor-pointer hover:scale-110 transition-transform inline-block" onclick="openFlyerLightbox('${troop.flyerImage}')" title="View recruiting flyer">📄</span>` : ''}
                            </h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${troop.location}, ${troop.city}</p>
                        </div>
                    </div>
                    <div class="badge bg-scout-gold text-gray-900">
                        Match: ${troop.score} pts
                    </div>
                </div>
                
                <div class="space-y-1 text-sm">
                    <p class="font-semibold text-scout-blue dark:text-scout-gold mb-2">Why this troop is a great fit:</p>
                    ${troop.reasons.map(reason => `
                        <div class="flex items-start gap-2">
                            <span class="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                            <span class="text-gray-700 dark:text-gray-300">${reason}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                    <strong>Meeting:</strong> ${troop.meetingDay}s ${troop.meetingTime} | 
                    <strong>Focus:</strong> ${troop.programFocus}
                    ${troop.distance ? ` | <strong>Distance:</strong> ${troop.distance.toFixed(1)} miles` : ''}

                    ${troop.philosophyApproach ? `<br><strong>Philosophy:</strong> ${troop.philosophyApproach.substring(0, 200)}...` : ''}
                </div>
            </div>
        `).join('');
    }
    
    recommendationsSection.classList.remove('hidden');
    recommendationsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Edit Modal Functions
// Open edit modal from card (mobile) - shows field picker first
function openCardEditModal(troopNumber, troopIndex) {
    // Find the troop data
    const troop = troopData.find(t => t.troop === troopNumber);
    if (!troop) return;
    
    // Store for later use
    window.currentCardEditTroop = troop;
    
    // Build field picker
    const fields = [
        { name: 'Meeting Day/Time', value: `${troop.meetingDay || ''} ${troop.meetingTime || ''}`.trim() },
        { name: 'Meeting Location', value: `${troop.location || ''}, ${troop.address || ''}`.trim() },
        { name: 'Founded Year', value: troop.founded || 'Unknown' },
        { name: 'Troop Size', value: troop.size },
        { name: 'Chartered Organization', value: troop.charteredOrg },
        { name: 'Eagle Scouts', value: troop.eagles },
        { name: 'Program Focus', value: troop.programFocus },
        { name: 'Special Programs', value: getSpecialProgramsList(troop) },
        { name: 'High Adventure', value: troop.highAdventureShort || troop.highAdventure || '' },
        { name: 'PIP Hours', value: troop.pipHours || getPIPHoursNumeric(troop) },
        { name: 'Contact Info', value: troop.contact },
        { name: 'Philosophy & Approach', value: troop.philosophyApproach || '' },
        { name: 'Activity Frequency', value: troop.activityFrequency || '' },
        { name: 'Monthly Outings', value: troop.monthlyOutings || '' },
        { name: 'Regular Activities', value: troop.regularActivities || '' },
        { name: 'Summer Camps', value: troop.summerCamps || '' },
        { name: 'Leadership Structure', value: troop.leadershipStructure || '' },
        { name: 'Parent Involvement', value: JSON.stringify(troop.parentInvolvement || {}) }
    ];
    
    // Populate field picker
    const pickerList = document.getElementById('field-picker-list');
    pickerList.innerHTML = fields.map(field => `
        <div class="field-picker-item" onclick="selectFieldToEdit('${troopNumber}', '${escapeForOnclick(field.name)}', '${escapeForOnclick(String(field.value))}')">
            <div class="font-semibold text-sm">${field.name}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">${truncateText(String(field.value), 60)}</div>
        </div>
    `).join('');
    
    // Show field picker, hide form
    document.getElementById('field-picker-view').classList.remove('hidden');
    document.getElementById('edit-form-view').classList.add('hidden');
    document.getElementById('edit-form-email').classList.add('hidden');
    
    // Show modal
    document.getElementById('edit-modal').classList.remove('hidden');
}

// Select a field from the picker and show edit form
function selectFieldToEdit(troopNumber, fieldName, currentValue) {
    // Hide field picker, show form
    document.getElementById('field-picker-view').classList.add('hidden');
    document.getElementById('edit-form-view').classList.remove('hidden');
    
    // Populate the edit form
    openEditModal(troopNumber, fieldName, currentValue);
}

function openEditModal(troopNumber, fieldName, currentValue) {
    // Populate fields
    document.getElementById('edit-troop-display').value = `Troop ${troopNumber}`;
    document.getElementById('edit-field-display').value = fieldName;
    document.getElementById('edit-current').value = currentValue;
    document.getElementById('edit-suggested').value = '';
    document.getElementById('edit-notes').value = '';
    
    // Store data for later use
    window.currentEditData = {
        troop: troopNumber,
        field: fieldName,
        current: currentValue
    };
    
    // Reset to GitHub view
    showGitHubView();
    
    // Show modal
    document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    // Reset form
    document.getElementById('edit-suggested').value = '';
    document.getElementById('edit-notes').value = '';
    // Hide field picker, show form (reset to default state)
    document.getElementById('field-picker-view').classList.add('hidden');
    document.getElementById('edit-form-view').classList.remove('hidden');
    showGitHubView();
}

// Submit to GitHub
function submitToGitHub() {
    const suggested = document.getElementById('edit-suggested').value.trim();
    const notes = document.getElementById('edit-notes').value.trim();
    
    if (!suggested) {
        alert('Please enter a suggested correction');
        return;
    }
    
    const data = window.currentEditData;
    
    // Create GitHub issue title
    const title = `[Data Correction] Troop ${data.troop} - ${data.field}`;
    
    // Create GitHub issue body with markdown formatting
    const body = `## Data Correction Request

**Troop:** ${data.troop}
**Field:** ${data.field}

### Current Value
\`\`\`
${data.current}
\`\`\`

### Suggested Correction
\`\`\`
${suggested}
\`\`\`

${notes ? `### Additional Notes\n${notes}\n` : ''}

---
*Submitted via San Ramon Troop Finder*`;
    
    // Create GitHub issue URL with pre-filled data
    const githubUrl = `https://github.com/taralika/scout-troop-picker/issues/new?` + 
        `title=${encodeURIComponent(title)}` +
        `&body=${encodeURIComponent(body)}` +
        `&labels=data-correction,troop-${data.troop}`;
    
    // Open GitHub in new tab
    window.open(githubUrl, '_blank');
    
    // Close modal
    closeEditModal();
}

// Toggle between GitHub and Email views
function showEmailFallback() {
    // Copy data to email form hidden fields
    const data = window.currentEditData;
    const suggested = document.getElementById('edit-suggested').value;
    const notes = document.getElementById('edit-notes').value;
    
    if (!suggested.trim()) {
        alert('Please enter a suggested correction first');
        return;
    }
    
    document.getElementById('email-troop').value = `Troop ${data.troop}`;
    document.getElementById('email-field').value = data.field;
    document.getElementById('email-current').value = data.current;
    document.getElementById('email-suggested').value = suggested;
    document.getElementById('email-notes').value = notes;
    
    // Toggle views
    document.getElementById('edit-form-view').classList.add('hidden');
    document.getElementById('edit-form-email').classList.remove('hidden');
}

function showGitHubView() {
    document.getElementById('edit-form-view').classList.remove('hidden');
    document.getElementById('edit-form-email').classList.add('hidden');
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            alert('✓ Thank you! Your correction has been submitted and will be reviewed.');
            closeEditModal();
            form.reset();
        } else {
            throw new Error('Form submission failed');
        }
    })
    .catch(error => {
        alert('❌ There was an error submitting your correction. Please try again or contact us directly.');
        console.error('Form submission error:', error);
    });
}

// Utility Functions
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Make functions globally accessible for onclick handlers
window.openEditModal = openEditModal;
window.openFlyerLightbox = openFlyerLightbox;

