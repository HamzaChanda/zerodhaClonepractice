(function () {
    'use strict';

    // === CONFIGURATION ===
    const scriptTag = document.currentScript;
    const configPath = scriptTag?.getAttribute('data-config');
    const apiUrl = scriptTag?.getAttribute('data-api');
    const debug = scriptTag?.getAttribute('data-debug') === 'true';

    function log(...args) {
        if (debug) console.log('[Pyngl]', ...args);
    }

    function warn(...args) {
        console.warn('[Pyngl]', ...args);
    }   

    // === PREVIEW MODE ===
    const urlParams = new URLSearchParams(window.location.search);
    const isPreviewMode = urlParams.get('pyngl_preview') === 'true' || urlParams.get('p') === '1' || sessionStorage.getItem('pyngl_preview_active') === 'true';
    const previewToken = urlParams.get('pyngl_token') || urlParams.get('t') || sessionStorage.getItem('pyngl_preview_token');
    
    if ((urlParams.get('pyngl_preview') === 'true' || urlParams.get('p') === '1') && previewToken) {
        sessionStorage.setItem('pyngl_preview_active', 'true');
        sessionStorage.setItem('pyngl_preview_token', previewToken);
    }

    function decodePreviewToken(token) {
        if (!token) return null;
        try {
            // Handle JWT format (header.payload.signature)
            if (token.includes('.') && token.split('.').length === 3) {
                const payload = token.split('.')[1];
                const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
                const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
                const decoded = JSON.parse(atob(paddedBase64));
                log('Decoded Preview Token:', decoded);
                return decoded;
            }

            // Decode base64
            const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
            const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
            const decoded = JSON.parse(atob(paddedBase64));

            // Map compact keys back to original names
            if (decoded.e) {
                return {
                    email: decoded.e,
                    exp: decoded.x,
                    identity: decoded.i === 'p' ? 'preview_user' : decoded.i,
                    mode: decoded.m === 'o' ? 'offline_fallback' : decoded.m,
                    elementId: decoded.eid
                };
            }
            return decoded;
        } catch (e) {
            warn('Failed to decode preview token:', e.message);
            // Fallback for simple mock strings
            if (typeof token === 'string' && token.startsWith('mock_')) {
                return { email: token.split('_')[1] || 'mock@example.com' };
            }
            return null;
        }
    }

    function injectPreviewBadge() {
        if (!isPreviewMode) return;
        const badge = document.createElement('div');
        badge.id = 'pyngl-preview-badge';
        Object.assign(badge.style, {
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            background: 'rgba(63, 251, 0, 0.9)',
            color: '#000',
            padding: '8px 16px',
            borderRadius: '100px',
            fontSize: '12px',
            fontWeight: '800',
            zIndex: '2147483647',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid rgba(0,0,0,0.1)',
            backdropFilter: 'blur(4px)',
            cursor: 'default',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        });
        badge.innerHTML = `
            <span style="display:flex; width:8px; height:8px; background:#000; border-radius:50%; animation: pulse 2s infinite;"></span>
            PRETA PREVIEW MODE
        `;
        
        const style = document.createElement('style');
        style.textContent = '@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }';
        document.head.appendChild(style);
        document.body.appendChild(badge);
    }

    // === ANALYTICS TRACKING ===
    // Inserts events into analytics_events table
    const SUPABASE_URL = 'https://hnlqpgxlxcsybhcjkrde.supabase.co';
    const ANALYTICS_URL = SUPABASE_URL + '/rest/v1/analytics_events';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhubHFwZ3hseGNzeWJoY2prcmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxOTk3OCwiZXhwIjoyMDgxNzk1OTc4fQ.STJNjcSTIPR9DSLBx0U1T4piLGBAbRRy2csDRJVy9ts';
    
    // Persistent Session ID
    let sessionId = localStorage.getItem('pyngl_session_id');
    if (!sessionId) {
        sessionId = 'pyngl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('pyngl_session_id', sessionId);
    }

    // Event Deduplication Cache
    const trackedEvents = {};

    function getDevice() {
        const w = window.innerWidth;
        if (w < 768) return 'mobile';
        if (w < 1024) return 'tablet';
        return 'desktop';
    }

    function getBrowser() {
        const ua = navigator.userAgent;
        if (ua.includes('Edg/')) return 'Edge';
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
        if (ua.includes('MSIE') || ua.includes('Trident/')) return 'IE';
        return 'Other';
    }

    function trackEvent(elementId, elementType, eventType) {
        if (!elementId) return;

        // Deduplication Check: Only track each event once per session/page-load
        const trackingKey = elementId + '_' + eventType;
        if (trackedEvents[trackingKey]) {
            log('🚫 Skipping duplicate ' + eventType + ' for:', elementId);
            return;
        }
        trackedEvents[trackingKey] = true;
        
        const event = {
            element_id: elementId,
            element_type: elementType,
            event_type: eventType,
            device: getDevice(),
            browser: getBrowser(),
            domain: window.location.hostname,
            pathname: window.location.pathname,
            session_id: sessionId,
            created_at: new Date().toISOString()
        };

        log('📊 Tracking:', eventType, elementId);

        // Supabase REST MUST have an array for POST
        const payload = JSON.stringify([event]);

        // Unified fetch with keepalive: true (Critical for clicks)
        // Note: Do NOT add query parameters like _t as it confuses PostgREST
        fetch(ANALYTICS_URL, {
            method: 'POST',
            keepalive: true,
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': previewToken ? 'Bearer ' + previewToken : 'Bearer ' + SUPABASE_KEY,
                'Prefer': 'return=minimal'
            },
            body: payload
        }).then(response => {
            if (response.ok) {
                log('✅ ' + eventType + ' saved');
            } else {
                log('❌ Analytics rejected:', response.status);
            }
        }).catch(err => {
            log('🌐 Tracking failed:', err.message);
        });
    }

    function openFloatingForm(config, elementId) {
        if (!config) return;

        log('📝 Opening form for:', elementId);

        const overlay = document.createElement('div');
        overlay.className = 'pyngl-form-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2147483647,
            backdropFilter: 'blur(4px)',
            opacity: 0,
            transition: 'opacity 0.3s ease'
        });

        const container = document.createElement('div');
        container.className = 'pyngl-form-container';
        Object.assign(container.style, {
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            position: 'relative',
            transform: 'translateY(20px)',
            transition: 'all 0.3s ease'
        });

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '16px',
            right: '16px',
            border: 'none',
            background: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666'
        });
        closeBtn.onclick = () => {
            overlay.style.opacity = 0;
            container.style.transform = 'translateY(20px)';
            setTimeout(() => overlay.remove(), 300);
        };

        const headline = document.createElement('h2');
        headline.textContent = config.headline || 'Contact Us';
        Object.assign(headline.style, {
            margin: '0 0 8px 0',
            fontSize: '24px',
            color: '#111',
            fontWeight: 'bold'
        });

        const description = document.createElement('p');
        description.textContent = config.description || '';
        Object.assign(description.style, {
            margin: '0 0 24px 0',
            fontSize: '14px',
            color: '#666',
            lineHeight: '1.5'
        });

        const form = document.createElement('form');
        Object.assign(form.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
        });

        (config.fields || []).forEach((field, idx) => {
            const fieldGroup = document.createElement('div');
            
            const label = document.createElement('label');
            label.textContent = field.label;
            Object.assign(label.style, {
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '6px'
            });

            let input;
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.rows = 3;
            } else {
                input = document.createElement('input');
                input.type = field.type;
            }
            
            input.name = `field_${idx}`;
            input.required = field.required;
            input.placeholder = field.placeholder || '';
            Object.assign(input.style, {
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #DDD',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
            });
            
            input.onfocus = () => input.style.borderColor = '#3FFB00';
            input.onblur = () => input.style.borderColor = '#DDD';

            fieldGroup.appendChild(label);
            fieldGroup.appendChild(input);
            form.appendChild(fieldGroup);
        });

        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.textContent = config.submitText || 'Submit';
        Object.assign(submitBtn.style, {
            marginTop: '8px',
            padding: '14px',
            backgroundColor: '#3FFB00',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
        });
        submitBtn.onmouseover = () => submitBtn.style.backgroundColor = '#35D400';
        submitBtn.onmouseout = () => submitBtn.style.backgroundColor = '#3FFB00';

        form.onsubmit = async (e) => {
            e.preventDefault();
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            submitBtn.style.opacity = 0.7;

            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => data[key] = value);

            log('📤 Form submission:', data);
            
            // Track the submission event
            trackEvent(elementId, 'form', 'submission');

            // Actual submission if endpoint exists, otherwise simulate success
            if (config.submissionEndpoint) {
                try {
                    const response = await fetch(config.submissionEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            elementId,
                            domain: location.hostname,
                            pathname: location.pathname,
                            formData: data,
                            timestamp: new Date().toISOString()
                        })
                    });
                    
                    if (!response.ok) throw new Error('Submission failed');
                    log('✅ Remote submission successful');
                } catch (err) {
                    log('🌐 Remote submission failed:', err.message);
                    // We still show success to user or could handle error UI
                }
            }

            setTimeout(() => {
                form.innerHTML = '';
                
                const successMsg = document.createElement('div');
                Object.assign(successMsg.style, {
                    textAlign: 'center',
                    padding: '24px 0'
                });

                const icon = document.createElement('div');
                icon.innerHTML = '✅';
                icon.style.fontSize = '48px';
                icon.style.marginBottom = '16px';

                const text = document.createElement('div');
                text.textContent = config.successMsg || config.successMessage || 'Thank you!';
                text.style.fontSize = '18px';
                text.style.fontWeight = '600';
                text.style.color = '#111';

                successMsg.appendChild(icon);
                successMsg.appendChild(text);
                form.appendChild(successMsg);

                setTimeout(() => {
                    overlay.style.opacity = 0;
                    container.style.transform = 'translateY(20px)';
                    setTimeout(() => overlay.remove(), 300);
                }, 2000);
            }, 600);
        };

        form.appendChild(submitBtn);
        container.appendChild(closeBtn);
        container.appendChild(headline);
        container.appendChild(description);
        container.appendChild(form);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // Fade in
        requestAnimationFrame(() => {
            overlay.style.opacity = 1;
            container.style.transform = 'translateY(0)';
        });
    }

    // Track impression when element becomes visible
    function observeImpression(element, elementId, elementType) {
        if (!elementId) return;
        
        log('👀 Starting observation for:', elementId);
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        log('✨ Impression triggered:', elementId);
                        trackEvent(elementId, elementType, 'impression');
                        observer.disconnect();
                    }
                });
            }, { 
                threshold: 0.1, // Trigger when 10% visible
                rootMargin: '0px' 
            });
            observer.observe(element);
        } else {
            // Fallback: track immediately
            trackEvent(elementId, elementType, 'impression');
        }
    }

    // === STATUS CHECK (Kill Switch Support) ===

    // Cache for element statuses (to avoid repeated API calls)
    const statusCache = {};

    // Check element status from API
    async function checkElementStatus(elementId) {
        // If no API URL configured, assume all elements are active
        if (!apiUrl) {
            return 'active';
        }

        // Check cache first
        if (statusCache[elementId]) {
            return statusCache[elementId];
        }

        try {
            const response = await fetch(apiUrl + '/elements?action=status_check&ids=' + encodeURIComponent(elementId));
            if (!response.ok) {
                log('Status check failed, assuming active');
                return 'active';
            }

            const data = await response.json();
            const status = data.statuses?.[elementId] || 'active';
            statusCache[elementId] = status;
            log('Element', elementId, 'status:', status);
            return status;
        } catch (error) {
            log('Status check error:', error.message);
            return 'active'; // Fail open - show element if API is unreachable
        }
    }

    // Check multiple element statuses at once
    async function checkMultipleStatuses(elementIds) {
        if (!apiUrl || elementIds.length === 0) {
            return {};
        }

        try {
            const response = await fetch(apiUrl + '/elements?action=status_check&ids=' + encodeURIComponent(elementIds.join(',')));
            if (!response.ok) {
                return {};
            }

            const data = await response.json();
            // Update cache
            Object.entries(data.statuses || {}).forEach(([id, status]) => {
                statusCache[id] = status;
            });
            return data.statuses || {};
        } catch (error) {
            log('Batch status check error:', error.message);
            return {};
        }
    }


    // === TARGETING LOGIC ===
    
    function checkTargeting(targeting) {
        // If no targeting rules, show element
        if (!targeting || Object.keys(targeting).length === 0) {
            return true;
        }

        let user = window.pynglUser;
        
        // Fallback to localStorage if available (for simulation/debug)
        if (!user) {
            try {
                const savedUser = localStorage.getItem('pyngl_sim_user');
                if (savedUser) {
                    user = JSON.parse(savedUser);
                    log('Using user data from localStorage fallback (pyngl_sim_user)');
                }
            } catch (e) {}
        }
        
        // If targeting exists but no user data provided, hide element (safer)
        if (!user) {
            log('Targeting rules exist but user data is missing. Hiding element.');
            return false;
        }

        // 1. City Check
        if (targeting.cities && targeting.cities.length > 0) {
            const city = (user.city || '').toLowerCase().trim();
            const targetCities = targeting.cities.map(c => c.toLowerCase().trim());
            if (!city || !targetCities.includes(city)) {
                log('Targeting mismatch: City. User:', city, 'Required:', targetCities);
                return false;
            }
        }

        // 2. State Check
        if (targeting.states && targeting.states.length > 0) {
            const state = (user.state || '').toLowerCase().trim();
            const targetStates = targeting.states.map(s => s.toLowerCase().trim());
            if (!state || !targetStates.includes(state)) {
                log('Targeting mismatch: State. User:', state, 'Required:', targetStates);
                return false;
            }
        }

        // 3. User Type Check
        if (targeting.userTypes && targeting.userTypes.length > 0) {
            const isPrime = user.isPrime === true; // Strict boolean check
            let typeMatch = false;

            if (targeting.userTypes.includes('Prime') && isPrime) typeMatch = true;
            if (targeting.userTypes.includes('Guest') && !isPrime) typeMatch = true;

            if (!typeMatch) {
                log('Targeting mismatch: User Type. User isPrime:', isPrime, 'Required:', targeting.userTypes);
                return false;
            }
        }

        // 4. Age Range Check
        if (targeting.ageRanges && targeting.ageRanges.length > 0) {
            const age = parseInt(user.age);
            if (isNaN(age)) {
                log('Targeting mismatch: User age is invalid', user.age);
                return false;
            }

            let ageMatch = false;
            for (const range of targeting.ageRanges) {
                if (range.endsWith('+')) {
                    const min = parseInt(range);
                    if (age >= min) {
                        ageMatch = true;
                        break;
                    }
                } else {
                    const [min, max] = range.split('-').map(Number);
                    if (age >= min && age <= max) {
                        ageMatch = true;
                        break;
                    }
                }
            }

            if (!ageMatch) {
                log('Targeting mismatch: Age. User:', age, 'Required:', targeting.ageRanges);
                return false;
            }
        }

        // 5. Payment Method Check
        if (targeting.paymentMethods && targeting.paymentMethods.length > 0) {
            const userPaymentMethod = (user.lastPaymentMethod || user.paymentMethod || '').toLowerCase().trim();
            const targetMethods = targeting.paymentMethods.map(pm => pm.toLowerCase().trim());
            if (!userPaymentMethod || !targetMethods.includes(userPaymentMethod)) {
                log('Targeting mismatch: Payment Method. User:', userPaymentMethod, 'Required:', targetMethods);
                return false;
            }
        }

        // 6. Targeted Audience Check
        if (targeting.targetedAudiences && targeting.targetedAudiences.length > 0) {
            const userAudience = (user.targetedAudience || '').trim();
            if (!userAudience) {
                log('Targeting mismatch: User has no assigned audience');
                return false;
            }
            
            // Case-insensitive match
            const targetAudiences = targeting.targetedAudiences.map(a => a.toLowerCase().trim());
            if (!targetAudiences.includes(userAudience.toLowerCase())) {
                log('Targeting mismatch: Audience. User:', userAudience, 'Required:', targetAudiences);
                return false;
            }
        }

        return true;
    }

    // === COLOR UTILS ===
    function getBrightness(color) {
        if (!color) return 255;
        
        // Handle RGB/RGBA
        if (color.indexOf('rgb') > -1) {
            const matches = color.match(/\d+/g);
            if (matches && matches.length >= 3) {
                const r = parseInt(matches[0]);
                const g = parseInt(matches[1]);
                const b = parseInt(matches[2]);
                return (r * 299 + g * 587 + b * 114) / 1000;
            }
        }
        
        // Strip # and spaces and handle Hex
        const hex = color.replace(/[^0-9a-fA-F]/g, '');
        let r, g, b;
        
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6 || hex.length === 8) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else {
            return 255; // Default to white/bright if invalid
        }
        
        // Perceived brightness (YIQ formula)
        return (r * 299 + g * 587 + b * 114) / 1000;
    }

    function isDark(color) {
        if (!color || typeof color !== 'string') return false;
        // Basic check for "black" word OR extremely dark hex
        if (color.toLowerCase() === 'black') return true;
        
        // Handle transparency in RGBA (if alpha is low, it's not "dark" effectively if over white, 
        // but here we assume opaque background for contrast checks usually)
        
        return getBrightness(color) < 128;
    }

    // === ELEMENT INJECTORS ===

    function injectClone(data, elementId) {
        if (!data || !data.targetSelector) {
            warn('Clone missing targetSelector');
            return;
        }

        const maxAttempts = 10;
        const attemptDelay = 500;
        let attempts = 0;

        function findTarget() {
            // Strategy 1: Exact selector
            let target = document.querySelector(data.targetSelector);

            // Strategy 2: Find by anchor text
            if (!target && data.anchorText) {
                const els = document.querySelectorAll('a, button, [role="button"], span, div[onclick]');
                for (let i = 0; i < els.length; i++) {
                    const text = els[i].textContent || '';
                    if (text.trim() === data.anchorText || text.includes(data.anchorText)) {
                        target = els[i];
                        log('Found by anchorText:', data.anchorText);
                        break;
                    }
                }
            }

            // Strategy 3: data-testid or aria-label
            if (!target && data.testId) {
                target = document.querySelector('[data-testid="' + data.testId + '"]');
            }
            if (!target && data.ariaLabel) {
                target = document.querySelector('[aria-label="' + data.ariaLabel + '"]');
            }
            if (!target && data.anchorAriaLabel) {
                target = document.querySelector('[aria-label="' + data.anchorAriaLabel + '"]');
            }

            // Strategy 4: Simplified selector (last part only)
            if (!target && data.targetSelector.includes('>')) {
                const parts = data.targetSelector.split('>');
                const lastPart = parts[parts.length - 1].trim();
                const simplified = lastPart.replace(/:nth-child\([^)]+\)/g, '');
                if (simplified) {
                    const candidates = document.querySelectorAll(simplified);
                    if (candidates.length === 1) {
                        target = candidates[0];
                        log('Found by simplified selector:', simplified);
                    }
                }
            }

            return target;
        }

        function attemptInjection() {
            attempts++;
            const target = findTarget();

            if (!target) {
                if (attempts < maxAttempts) {
                    log('Target not found, retrying... (' + attempts + '/' + maxAttempts + ')');
                    setTimeout(attemptInjection, attemptDelay);
                    return;
                } else {
                    warn('Target not found after ' + maxAttempts + ' attempts:', data.targetSelector);
                    return;
                }
            }

            // Prevent duplicate injection
            if (target.hasAttribute('data-pyngl-injected')) {
                log('Clone already injected for this target');
                return;
            }
            target.setAttribute('data-pyngl-injected', 'true');

            // Create the clone element
            const clone = document.createElement(data.tag || 'button');
            clone.innerHTML = data.innerHTML || '';

            // CRITICAL: Copy the TARGET's current className, not the saved one!
            if (target.className) {
                clone.className = target.className;
            } else if (data.className) {
                clone.className = data.className;
            }

            clone.style.cssText = '';
            clone.setAttribute('data-pyngl-element', 'clone');
            clone.setAttribute('data-pyngl-id', elementId || '');

            // Apply hover effects with transition
            if (data.hoverCssText) {
                if (data.transitionCssText) {
                    clone.style.transition = data.transitionCssText;
                }

                clone.addEventListener('mouseenter', function () {
                    const hoverStyles = data.hoverCssText.split(';');
                    hoverStyles.forEach(function (style) {
                        if (style.trim()) {
                            const [prop, ...valueParts] = style.split(':');
                            if (prop && valueParts.length) {
                                const propName = prop.trim();
                                const value = valueParts.join(':').trim();
                                const camelProp = propName.replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); });
                                clone.style[camelProp] = value;
                            }
                        }
                    });
                });

                clone.addEventListener('mouseleave', function () {
                    clone.style.cssText = '';
                    if (data.transitionCssText) {
                        clone.style.transition = data.transitionCssText;
                    }
                });
            }

            // Bulletproof Click Logic (Capturing Phase + Mousedown Backup)
            const handleManualClick = (e) => {
                // Prevent multiple triggers from mousedown + click
                if (clone._isTracking) return;
                clone._isTracking = true;
                setTimeout(() => clone._isTracking = false, 500);

                log('👆 Intercepted interaction:', elementId);
                trackEvent(elementId, 'clone', 'click');
            };

            // Use Capturing phase (true) to beat other listeners
            clone.addEventListener('click', handleManualClick, true);
            clone.addEventListener('mousedown', handleManualClick, true);

            // Link or Form logic
            if (data.actionType === 'form') {
                if (clone.tagName === 'A') clone.href = '#';
                clone.style.cursor = 'pointer';
                clone.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openFloatingForm(data.formConfig, elementId);
                };
            } else if (data.href) {
                if (clone.tagName === 'A') clone.href = data.href;
                clone.style.cursor = 'pointer';
                clone.onclick = function(e) {
                    if (data.href !== '#') {
                        e.preventDefault();
                        window.open(data.href, '_blank');
                    }
                };
            }

            const position = data.position || 'right';
            const parent = target.parentElement;

            if (parent) {
                if (position === 'left' || position === 'top') {
                    parent.insertBefore(clone, target);
                } else {
                    parent.insertBefore(clone, target.nextSibling);
                }
            }

            // Track impression when clone becomes visible
            observeImpression(clone, elementId, 'clone');

            // === RESPONSIVENESS FIX === 
            // Ensure clone follows target if target interacts with responsive menus/drawers
            function ensureCloneFollowsTarget() {
                if (!document.body.contains(target)) return;
                
                // If clone was removed relative to target's parent (e.g. target moved to a new div)
                if (clone.parentElement !== target.parentElement) {
                    log('Target moved, relocating clone...');
                    const newParent = target.parentElement;
                    if (newParent) {
                        if (position === 'left' || position === 'top') {
                            newParent.insertBefore(clone, target);
                        } else {
                            newParent.insertBefore(clone, target.nextSibling);
                        }
                    }
                }
            }

            // Check on resize (debounced slightly)
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(ensureCloneFollowsTarget, 100);
            });

            // Periodic check (every 1s) to catch JS-driven layout changes that don't trigger resize
            setInterval(ensureCloneFollowsTarget, 1000);

            log('Clone injected successfully');
        }

        attemptInjection();
    }

    function injectModal(data, elementId) {
        const overlay = document.createElement('div');
        overlay.setAttribute('data-pyngl-element', 'modal');
        overlay.setAttribute('data-pyngl-id', elementId || '');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:2147483645;font-family:-apple-system,sans-serif;';

        // Auto-contrast logic
        let bgColor = data.bgColor || '#fff';
        let textColor = data.textColor || '#1f2937';
        
        // If background is dark AND text is dark, force text to white
        if (isDark(bgColor) && isDark(textColor)) {
            log('🌓 Auto-adjusting modal text color to white for contrast');
            textColor = '#ffffff';
        }

        const dialog = document.createElement('div');
        dialog.style.cssText = 'background:' + bgColor + ';color:' + textColor + ';padding:32px 40px;border-radius:16px;max-width:420px;width:90%;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,0.3);position:relative;';

        const buttonLink = data.actionType === 'form' ? '#' : (data.buttonLink || '#');
        dialog.innerHTML = '<button style="position:absolute;top:12px;right:16px;background:transparent;border:none;font-size:24px;cursor:pointer;color:inherit;">×</button>' +
            '<h2 style="margin:0 0 12px 0;font-size:24px;font-weight:700;color:inherit;">' + (data.headline || 'Modal') + '</h2>' +
            '<p style="margin:0 0 24px 0;font-size:15px;opacity:0.85;color:inherit;">' + (data.description || '') + '</p>' +
            '<a href="' + buttonLink + '" style="display:inline-block;background:' + (data.buttonColor || '#3B82F6') + ';color:white;padding:14px 32px;border-radius:100px;text-decoration:none;font-weight:600;">' + (data.buttonText || 'Click') + '</a>';

        // Close button with dismiss tracking
        dialog.querySelector('button').onclick = function () { 
            trackEvent(elementId, 'modal', 'dismiss');
            overlay.remove(); 
        };
        
        // Overlay click dismiss
        overlay.onclick = function (e) { 
            if (e.target === overlay) {
                trackEvent(elementId, 'modal', 'dismiss');
                overlay.remove();
            }
        };

        // CTA click tracking & Action handling
        const cta = dialog.querySelector('a');
        if (cta) {
            cta.onclick = function(e) {
                trackEvent(elementId, 'modal', 'cta_click');
                if (data.actionType === 'form') {
                    e.preventDefault();
                    overlay.remove(); // Close modal first
                    openFloatingForm(data.formConfig, elementId);
                }
            };
        }

        overlay.appendChild(dialog);

        setTimeout(function () { 
            document.body.appendChild(overlay);
            // Track impression when modal is shown
            trackEvent(elementId, 'modal', 'impression');
        }, (data.showDelay || 0) * 1000);
        
        log('Modal injected');
    }

    function injectBanner(data, elementId) {
        const isTop = data.position !== 'bottom';
        const bar = document.createElement('div');
        bar.setAttribute('data-pyngl-element', 'banner');
        bar.setAttribute('data-pyngl-id', elementId || '');

        const baseStyle = 'position:fixed;' + (isTop ? 'top:0' : 'bottom:0') + ';left:0;width:100%;z-index:2147483644;';

        const pushedElements = [];

        function adjustPageLayout() {
            // Context: This function might be called multiple times (e.g. on inject and on img.load)
            // We must first RESET any previous adjustments to ensure we start from a clean state.
            
            // 1. Restore previously pushed elements
            pushedElements.forEach(function(item) {
                if (item.el && item.originalTop !== undefined) {
                    item.el.style.top = item.originalTop;
                }
            });
            // Clear the array to repopulate it
            pushedElements.length = 0;

            // 2. Restore body padding
            const prop = isTop ? 'paddingTop' : 'paddingBottom';
            const added = parseInt(bar.getAttribute('data-padding-added') || '0');
            if (added > 0) {
                const current = parseInt(document.body.style[prop]) || 0;
                const newVal = Math.max(0, current - added);
                document.body.style[prop] = newVal === 0 ? '' : newVal + 'px';
                bar.removeAttribute('data-padding-added');
            }

            // NOW calculate fresh
            const bannerHeight = bar.offsetHeight || 0;
            if (bannerHeight === 0) return; // Don't adjust if no height (element hidden/not loaded)

            if (isTop) {
                // Find and push down all fixed/sticky elements at top
                const selectors = 'header, nav, [role="banner"], [role="navigation"], [class*="header"], [class*="nav"], [class*="sticky"], [class*="fixed"]';
                const allElements = document.querySelectorAll(selectors);
                
                allElements.forEach(function(el) {
                    if (el === bar || el.hasAttribute('data-pyngl-element')) return;
                    
                    const style = window.getComputedStyle(el);
                    const position = style.position;
                    const currentTop = parseInt(style.top) || 0;
                    
                    // Check for fixed/sticky positioning near the top
                    if ((position === 'fixed' || position === 'sticky') && currentTop >= 0 && currentTop < 100) {
                        const rect = el.getBoundingClientRect();
                        // Only push elements that are actually at the top of the viewport
                        if (rect.top >= -5 && rect.top < bannerHeight + 50) {
                            // Track ORIGINAL top before we modify it
                            pushedElements.push({ el: el, originalTop: el.style.top });
                            el.style.top = (currentTop + bannerHeight) + 'px';
                        }
                    }
                });

                // Also check direct children of body generic fixed elements
                const bodyChildren = document.body.children;
                for (var i = 0; i < bodyChildren.length; i++) {
                    const el = bodyChildren[i];
                    if (el === bar || el.hasAttribute('data-pyngl-element') || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;

                    const style = window.getComputedStyle(el);
                    if ((style.position === 'fixed' || style.position === 'sticky') && 
                        (style.top === '0px' || style.top === '0')) {
                        
                        const rect = el.getBoundingClientRect();
                        if (rect.top >= -5 && rect.top < bannerHeight + 50 && rect.height > 0) {
                             const alreadyPushed = pushedElements.some(function(p) { return p.el === el; });
                             if (!alreadyPushed) {
                                pushedElements.push({ el: el, originalTop: el.style.top });
                                el.style.top = bannerHeight + 'px';
                             }
                        }
                    }
                }
            }

            // Add body padding
            const currentCtx = window.getComputedStyle(document.body);
            const currentVal = parseInt(currentCtx[prop]) || 0;
            // Store original padding only if not already stored (though we just reset it, so currentVal should be original)
            const originalAttr = bar.getAttribute('data-original-padding');
            if (originalAttr === null) {
                 bar.setAttribute('data-original-padding', document.body.style[prop] || '');
            }
            
            document.body.style[prop] = (currentVal + bannerHeight) + 'px';
            bar.setAttribute('data-padding-prop', prop);
            bar.setAttribute('data-padding-added', bannerHeight);
        }

        function removeBanner() {
            trackEvent(elementId, 'banner', 'dismiss');
            
            // Restore pushed elements
            pushedElements.forEach(function(item) {
                item.el.style.top = item.originalTop;
            });

            // Restore body padding
            const prop = bar.getAttribute('data-padding-prop');
            const added = parseInt(bar.getAttribute('data-padding-added') || '0');
            if (prop) {
                const current = parseInt(document.body.style[prop]) || 0;
                const newVal = Math.max(0, current - added);
                document.body.style[prop] = newVal === 0 ? '' : newVal + 'px';
            }

            bar.remove();
        }

        if (data.type === 'image' && data.imageData) {
            bar.classList.add('pyngl-banner-wrapper');
            bar.style.cssText = baseStyle;

            const wrapper = document.createElement('a');
            wrapper.href = data.actionType === 'form' ? '#' : (data.imageLink || '#');
            // Use a separate class for image banners to avoid padding
            wrapper.className = 'pyngl-banner-content-image';
            wrapper.style.display = 'block';
            wrapper.style.textDecoration = 'none';
            wrapper.style.position = 'relative';
            wrapper.onclick = function(e) {
                trackEvent(elementId, 'banner', 'cta_click');
                if (data.actionType === 'form') {
                    e.preventDefault();
                    openFloatingForm(data.formConfig, elementId);
                }
            };

            const img = document.createElement('img');
            img.src = data.imageData;
            img.className = 'pyngl-banner-img';
            // Keep object-fit and display as inline styles for now as they are structural
            img.style.cssText = 'width:100%;height:auto;display:block;object-fit:cover;'; // Changed to cover for full fit
            
            // Fix for "gaps" on hard refresh - ensure layout adjusts when image loads
            img.onload = function() {
                adjustPageLayout();
            };

            wrapper.appendChild(img);

            if (data.dismissible) {
                const close = document.createElement('button');
                close.innerHTML = '×';
                close.style.cssText = 'position:absolute;top:8px;right:12px;background:rgba(0,0,0,0.5);border:none;color:white;width:28px;height:28px;border-radius:50%;font-size:18px;cursor:pointer;';
                close.onclick = function (e) { e.preventDefault(); removeBanner(); };
                wrapper.appendChild(close);
            }
            bar.appendChild(wrapper);
        } else {
            bar.classList.add('pyngl-banner-wrapper');
            bar.classList.add('pyngl-banner-content');
            
            // Base styles + dynamic colors
            bar.style.cssText = baseStyle + 'background:' + (data.bgColor || '#3B82F6') + ';color:' + (data.textColor || '#fff') + ';';

            const text = document.createElement('span');
            text.textContent = data.bannerText || 'Banner';
            bar.appendChild(text);

            if (data.buttonText) {
                const btn = document.createElement('a');
                btn.href = data.actionType === 'form' ? '#' : (data.buttonLink || '#');
                btn.textContent = data.buttonText;
                btn.style.cssText = 'background:' + (data.buttonColor || '#fff') + ';color:' + (data.bgColor || '#3B82F6') + ';padding:8px 20px;border-radius:100px;text-decoration:none;font-weight:600;';
                btn.onclick = function(e) {
                    trackEvent(elementId, 'banner', 'cta_click');
                    if (data.actionType === 'form') {
                        e.preventDefault();
                        openFloatingForm(data.formConfig, elementId);
                    }
                };
                bar.appendChild(btn);
            }

            if (data.dismissible) {
                const close = document.createElement('button');
                close.innerHTML = '×';
                close.style.cssText = 'background:transparent;border:none;color:inherit;font-size:20px;cursor:pointer;margin-left:auto;';
                close.onclick = function () { removeBanner(); };
                bar.appendChild(close);
            }
        }

        setTimeout(function () { 
            document.body.appendChild(bar);
            // Adjust layout after injection to ensure dimensions are correct
            requestAnimationFrame(function() {
                adjustPageLayout();
            });
            // Track impression when banner is shown
            trackEvent(elementId, 'banner', 'impression');
        }, (data.showDelay || 0) * 1000);
        
        log('Banner injected');
    }

    function injectBadge(data, elementId) {
        log('🏷️ Injecting badge:', elementId);
        
        const badge = document.createElement('div');
        badge.setAttribute('data-pyngl-element', 'badge');
        badge.setAttribute('data-pyngl-id', elementId || '');
        
        if (data.type === 'image' && data.imageData) {
            const img = document.createElement('img');
            img.src = data.imageData;
            img.style.cssText = 'width:30px;height:30px;object-fit:contain;display:block;';
            badge.appendChild(img);
        } else {
            badge.textContent = data.text || 'NEW';
            badge.style.padding = '4px 10px';
        }

        const bgColor = data.bgColor || '#EF4444';
        const textColor = data.textColor || '#fff';
        const borderRadius = data.shape === 'pill' ? '100px' : (data.shape === 'square' ? '4px' : '50%');
        
        badge.style.backgroundColor = bgColor;
        badge.style.color = textColor;
        badge.style.borderRadius = borderRadius;
        badge.style.fontWeight = '700';
        badge.style.fontSize = '10px';
        badge.style.textTransform = 'uppercase';
        badge.style.zIndex = '2147483643';
        badge.style.display = 'inline-flex';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
        badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        badge.style.transition = 'transform 0.2s ease';

        // Click handler
        badge.onclick = function(e) {
            e.stopPropagation();
            trackEvent(elementId, 'badge', 'click');
            if (data.actionType === 'form') {
                e.preventDefault();
                openFloatingForm(data.formConfig, elementId);
            } else if (data.link) {
                window.open(data.link, '_blank');
            }
        };
        if (data.actionType === 'form' || data.link) {
            badge.style.cursor = 'pointer';
            badge.onmouseover = () => badge.style.transform = 'scale(1.05)';
            badge.onmouseout = () => badge.style.transform = 'scale(1)';
        }

        if (data.attachMode === 'element' && data.targetSelector) {
            let target = document.querySelector(data.targetSelector);
            if (!target) {
                // Try simpler lookup if complex selector fails
                const parts = data.targetSelector.split(' ');
                target = document.querySelector(parts[parts.length - 1]);
            }

            if (target) {
                const pos = data.position || 'top-right';
                
                if (pos.startsWith('inline')) {
                    // Inline attachment
                    badge.style.position = 'relative';
                    badge.style.margin = '0 8px';
                    if (pos === 'inline-left') {
                        target.parentNode.insertBefore(badge, target);
                    } else {
                        target.parentNode.insertBefore(badge, target.nextSibling);
                    }
                } else {
                    // Relative/Floating attachment
                    target.style.position = (target.style.position && target.style.position !== 'static') ? target.style.position : 'relative';
                    badge.style.position = 'absolute';
                    
                    const offset = (data.offset || 0) + 'px';
                    
                    if (pos === 'top') { badge.style.top = '-' + offset; badge.style.left = '50%'; badge.style.transform = 'translateX(-50%)'; }
                    else if (pos === 'bottom') { badge.style.bottom = '-' + offset; badge.style.left = '50%'; badge.style.transform = 'translateX(-50%)'; }
                    else if (pos === 'left') { badge.style.left = '-' + offset; badge.style.top = '50%'; badge.style.transform = 'translateY(-50%)'; }
                    else if (pos === 'right') { badge.style.right = '-' + offset; badge.style.top = '50%'; badge.style.transform = 'translateY(-50%)'; }
                    else if (pos === 'top-right') { badge.style.top = '0'; badge.style.right = '0'; }
                    else if (pos === 'top-left') { badge.style.top = '0'; badge.style.left = '0'; }
                    else if (pos === 'bottom-right') { badge.style.bottom = '0'; badge.style.right = '0'; }
                    else if (pos === 'bottom-left') { badge.style.bottom = '0'; badge.style.left = '0'; }
                    
                    target.appendChild(badge);
                }
            } else {
                warn('Badge target not found:', data.targetSelector);
                // Fallback to screen if target missing? Or just omit.
            }
        } else {
            // Screen attachment
            badge.style.position = 'fixed';
            const posMap = {
                'top-right': 'top:20px;right:20px',
                'top-left': 'top:20px;left:20px',
                'bottom-right': 'bottom:20px;right:20px',
                'bottom-left': 'bottom:20px;left:20px'
            };
            const pos = posMap[data.position] || posMap['bottom-right'];
            badge.style.cssText += pos + ';';
            document.body.appendChild(badge);
        }

        if (data.dismissible) {
            const close = document.createElement('span');
            close.innerHTML = '×';
            close.style.cssText = 'margin-left:6px;cursor:pointer;font-size:14px;line-height:1;opacity:0.7;';
            close.onclick = (e) => {
                e.stopPropagation();
                trackEvent(elementId, 'badge', 'dismiss');
                badge.remove();
            };
            badge.appendChild(close);
        }

        setTimeout(function () { 
            observeImpression(badge, elementId, 'badge');
        }, (data.showDelay || 0) * 1000);
    }

    function injectFAB(data, elementId) {
        const fab = document.createElement('div');
        fab.setAttribute('data-pyngl-element', 'fab');
        fab.setAttribute('data-pyngl-id', elementId || '');

        const sizeStyles = {
            'small': 'width:48px;height:48px;font-size:12px',
            'medium': 'width:56px;height:56px;font-size:14px',
            'large': 'width:64px;height:64px;font-size:16px'
        };

        const shapeRadius = {
            'round': '50%',
            'pill': '16px',
            'square': '8px'
        };

        const isIcon = data.type === 'icon' && data.iconData;
        const isAbsolute = data.positionMode === 'absolute';

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 20;

        const finalX = data.x !== undefined ? data.x : (viewportWidth - 80);
        const finalY = data.y !== undefined ? data.y : (viewportHeight - 80);

        const safeX = Math.max(padding, Math.min(finalX, viewportWidth - 60));
        const safeY = Math.max(padding, Math.min(finalY, viewportHeight - 60));

        let css = 'position:' + (isAbsolute ? 'absolute' : 'fixed') + ';';
        css += 'left:' + safeX + 'px;top:' + safeY + 'px;';
        css += (sizeStyles[data.size || 'medium']) + ';';
        css += 'border-radius:' + (shapeRadius[data.shape || 'round']) + ';';
        css += 'background:' + (isIcon ? 'transparent' : (data.bgColor || '#10B981')) + ';';
        css += 'color:' + (data.textColor || '#fff') + ';';
        css += 'display:flex;align-items:center;justify-content:center;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,0.3);cursor:pointer;z-index:2147483640;';

        fab.style.cssText = css;

        if (isIcon && data.iconData) {
            const img = document.createElement('img');
            img.src = data.iconData;
            img.style.cssText = 'width:60%;height:60%;object-fit:contain;pointer-events:none;';
            fab.appendChild(img);
        } else {
            fab.textContent = data.text || '+';
        }

        fab.onclick = function (e) { 
            trackEvent(elementId, 'fab', 'click');
            if (data.actionType === 'form') {
                e.preventDefault();
                e.stopPropagation();
                openFloatingForm(data.formConfig, elementId);
            } else if (data.link && data.link !== '#') {
                window.open(data.link, '_blank'); 
            }
        };
        
        document.body.appendChild(fab);
        // Track impression when FAB becomes visible
        observeImpression(fab, elementId, 'fab');
        
        log('FAB injected');
    }

    // === MAIN LOADER ===

    function injectElement(element) {
        const type = element.type;
        const data = element.data;
        const elementId = element.id || element._id;

        log('⚒️ Injecting:', type, 'with ID:', elementId || '(MISSING)');

        switch (type) {
            case 'clone':
                injectClone(data, elementId);
                break;
            case 'modal':
                injectModal(data, elementId);
                break;
            case 'banner':
                injectBanner(data, elementId);
                break;
            case 'badge':
                injectBadge(data, elementId);
                break;
            case 'fab':
                injectFAB(data, elementId);
                break;
            default:
                warn('Unknown element type:', type);
        }
    }

    async function loadConfig() {
        log('Loading config from:', configPath);
        const decodedToken = isPreviewMode ? decodePreviewToken(previewToken) : null;
        // Check both naming variants
        const targetElementId = decodedToken?.elementId || decodedToken?.element_id;
        
        if (targetElementId) {
            log('🎯 Targeted Preview Mode Active for ID:', targetElementId);
        }

        try {
            // 1. Fetch Config
            const separator = configPath.includes('?') ? '&' : '?';
            const url = configPath + separator + '_t=' + new Date().getTime() + (isPreviewMode ? '&preview=true' : '');
            
            const headers = {
                'Content-Type': 'application/json'
            };
            if (isPreviewMode && previewToken) {
                headers['Authorization'] = 'Bearer ' + previewToken;
            }

            let configResponse;
            try {
                configResponse = await fetch(url, { headers });
            } catch (fetchErr) {
                warn('Primary config fetch failed:', fetchErr.message);
            }

            let config;
            if (configResponse && configResponse.ok) {
                config = await configResponse.json();
                log('Config loaded from primary source:', config);
            } else if (isPreviewMode) {
                // FALLBACK: Fetch directly from Supabase if primary (localhost) failed during preview
                log('Fetching preview config directly from Supabase...');
                const email = decodedToken?.email;
                if (email) {
                    // Remove domain filter for fallback to be more permissive in preview mode
                    // Also filter for status=draft if we want to prioritize unpublished changes
                    let supabaseUrl = `${SUPABASE_URL}/rest/v1/elements?creator_email=eq.${encodeURIComponent(email)}&select=*`;
                    
                    if (targetElementId) {
                        // Support both id and local_id filtering
                        // Only include numeric ID filter if targetElementId is a number
                        const isNumeric = !isNaN(parseInt(targetElementId)) && String(parseInt(targetElementId)) === String(targetElementId);
                        if (isNumeric) {
                            supabaseUrl += `&or=(id.eq.${targetElementId},local_id.eq.${targetElementId})`;
                        } else {
                            // If it's a UUID/string, only search local_id to avoid Supabase 400 error (type mismatch)
                            supabaseUrl += `&local_id=eq.${targetElementId}`;
                        }
                    }

                    log('Supabase Fallback URL:', supabaseUrl);

                    let supabaseResp = await fetch(supabaseUrl, {
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': 'Bearer ' + SUPABASE_KEY,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    // Fail-safe: If targeted fetch failed (e.g. 400 error), try fetching all elements for this email
                    if (!supabaseResp.ok && targetElementId) {
                        warn('Targeted Supabase fetch failed, falling back to broad fetch.');
                        const broadUrl = `${SUPABASE_URL}/rest/v1/elements?creator_email=eq.${encodeURIComponent(email)}&select=*`;
                        supabaseResp = await fetch(broadUrl, {
                            headers: {
                                'apikey': SUPABASE_KEY,
                                'Authorization': 'Bearer ' + SUPABASE_KEY,
                                'Content-Type': 'application/json'
                            }
                        });
                    }
                    
                    if (supabaseResp.ok) {
                        config = await supabaseResp.json();
                        log(`Preview config loaded from Supabase: ${config.length} elements found.`);
                        
                        if (targetElementId && config.length > 0) {
                            log(`✓ Targeted preview active for element: ${targetElementId}`);
                        }
                    } else {
                        const errText = await supabaseResp.text().catch(() => 'No body');
                        warn('Supabase fallback failed:', supabaseResp.status, errText);
                    }
                } else {
                    warn('Could not extract email from preview token for fallback. Token:', previewToken);
                }
            }

            if (!config) {
                throw new Error('Failed to load config from all sources');
            }

            // 2. Fetch User Data (if endpoint provided)
            const userEndpoint = scriptTag?.getAttribute('data-user-endpoint');
            if (userEndpoint) {
                try {
                    const separator = userEndpoint.includes('?') ? '&' : '?';
                    const url = userEndpoint + separator + '_t=' + new Date().getTime();
                    
                    const userResponse = await fetch(url);
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        window.pynglUser = userData;
                        log('User data loaded from endpoint:', userData);
                    } else {
                        warn('Failed to load user data from endpoint:', userResponse.status);
                    }
                } catch (userErr) {
                    warn('Error fetching user data:', userErr.message);
                }
            }

            // 3. Process Elements
            const elements = [];
            
            // Handle array response from API
            if (Array.isArray(config)) {
                elements.push(...config);
            } else {
                if (config.element) {
                    elements.push(config.element);
                }
                if (config.elements && Array.isArray(config.elements)) {
                    elements.push(...config.elements);
                }
            }

            // Batch check statuses if API URL is configured
            const elementIds = elements.filter(el => el.id).map(el => el.id);
            if (apiUrl && elementIds.length > 0) {
                await checkMultipleStatuses(elementIds);
            }

            // Inject elements, skipping killed ones
            for (let element of elements) {
                // Normalize Supabase / nested data
                if (element.element && typeof element.element === 'object') {
                    // Merge nested element data into top level
                    element = { ...element, ...element.element };
                }

                const elementId = element.id || element._id || element.local_id;
                const type = element.type || element.element_type;
                let elementData = element.config || element.data || element.element_data;

                const matchesTarget = targetElementId && (
                    (element.id != null && String(element.id) === String(targetElementId)) ||
                    (element.local_id != null && String(element.local_id) === String(targetElementId)) ||
                    (element._id != null && String(element._id) === String(targetElementId))
                );

                if (targetElementId) {
                    log(`Comparing element [${elementId}] against target [${targetElementId}]. Match: ${matchesTarget}`);
                }

                // Targeted Preview Filter: If a specific targetElementId is active, skip all other elements
                if (targetElementId && !matchesTarget) {
                    log('Skipping non-targeted element:', elementId);
                    continue;
                }

                // Handle stringified JSON from Supabase/API
                if (typeof elementData === 'string') {
                    try {
                        elementData = JSON.parse(elementData);
                        log('Parsed stringified elementData for:', elementId);
                    } catch (e) {
                        warn('Failed to parse element_data JSON for:', elementId, e.message);
                        continue;
                    }
                }

                // Prepare normalized element for injection
                const normalizedElement = { 
                    ...element, 
                    id: elementId, 
                    type: type, 
                    data: elementData 
                };

                if (!elementData || !type) {
                    warn('Element missing data or type:', elementId);
                    continue;
                }

                // Check if element is killed (Bypass for targeted preview)
                if (elementId && statusCache[elementId] === 'killed' && !matchesTarget) {
                    log('Skipping killed element:', elementId);
                    continue;
                }

                // Check targeting rules (Bypass for targeted preview)
                if (!matchesTarget && !checkTargeting(elementData.targeting)) {
                    log('Skipping targeted element:', elementId);
                    continue;
                }

                if (matchesTarget) {
                    log('🚀 Rendering targeted element:', elementId);
                }

                // Inject with normalized data and ID
                injectElement(normalizedElement);
            }

            log('All elements processed');
        } catch (error) {
            warn('Error loading config:', error.message);
        }
    }

    // === GLOBAL STYLES ===
    function injectGlobalStyles() {
        const styleId = 'pyngl-global-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            /* Banner Responsiveness */
            .pyngl-banner-wrapper {
                box-sizing: border-box;
                width: 100%;
                z-index: 2147483644;
                transition: transform 0.3s ease;
            }
            
            .pyngl-banner-content {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 16px;
                padding: 14px 20px;
                flex-wrap: wrap;
            }

            .pyngl-banner-img {
                width: 100%;
                height: auto;
                display: block;
                max-height: 150px;
                object-fit: contain;
            }

            /* Mobile Adjustments */
            @media (max-width: 768px) {
                .pyngl-banner-content {
                    padding: 12px 16px;
                    gap: 10px;
                    text-align: center;
                }
                
                .pyngl-banner-img {
                    max-height: 100px;
                }
            }
        `;

        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectGlobalStyles();
            injectPreviewBadge();
            loadConfig();
        });
    } else {
        injectGlobalStyles();
        injectPreviewBadge();
        loadConfig();
    }

})();