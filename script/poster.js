document.addEventListener('DOMContentLoaded', function () {
    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            // Remove active class from all tabs and contents
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Add row functionality
    function setupAddButton(buttonId, containerId, placeholder1, placeholder2) {
        document.getElementById(buttonId).addEventListener('click', function () {
            const container = document.getElementById(containerId);
            const newRow = document.createElement('div');
            newRow.className = 'key-value-row';
            newRow.innerHTML = `
                <input type="text" class="key-value-input" placeholder="${placeholder1}">
                <input type="text" class="key-value-input" placeholder="${placeholder2}">
                <button class="remove-btn">×</button>
            `;
            container.appendChild(newRow);

            // Add event listener to the new remove button
            newRow.querySelector('.remove-btn').addEventListener('click', function () {
                if (container.querySelectorAll('.key-value-row').length > 1) {
                    container.removeChild(newRow);
                }
            });
        });
    }

    // Initialize add buttons
    setupAddButton('add-param', 'params-container', 'Key', 'Value');
    setupAddButton('add-header', 'headers-container', 'Header name', 'Header value');
    setupAddButton('add-cookie', 'cookies-container', 'Cookie name', 'Cookie value');

    // Initialize remove buttons for existing rows
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.parentNode;
            const container = row.parentNode;
            if (container.querySelectorAll('.key-value-row').length > 1) {
                container.removeChild(row);
            }
        });
    });

    // Auth type switcher
    document.getElementById('auth-type').addEventListener('change', function () {
        const authFields = document.getElementById('auth-fields');
        const type = this.value;

        authFields.innerHTML = '';

        if (type === 'basic') {
            authFields.innerHTML = `
                <div class="key-value-row">
                    <input type="text" class="key-value-input" placeholder="Username">
                    <input type="password" class="key-value-input" placeholder="Password">
                </div>
            `;
        } else if (type === 'bearer') {
            authFields.innerHTML = `
                <div class="key-value-row">
                    <input type="text" class="key-value-input" placeholder="Token" style="flex: 1">
                </div>
            `;
        } else if (type === 'api-key') {
            authFields.innerHTML = `
                <div class="key-value-row">
                    <input type="text" class="key-value-input" placeholder="Key name (e.g., X-API-KEY)">
                    <input type="text" class="key-value-input" placeholder="Key value">
                </div>
                <div class="key-value-row" style="margin-top: 10px;">
                    <select class="key-value-input">
                        <option value="header">Send in Header</option>
                        <option value="query">Send in Query Params</option>
                    </select>
                </div>
            `;
        }
    });

    // Generate cURL command
    document.getElementById('generate').addEventListener('click', function () {
        const method = document.getElementById('method').value;
        let url = document.getElementById('url').value.trim();

        if (!url) {
            alert('Please enter a URL');
            return;
        }

        // Process query parameters
        const params = [];
        document.querySelectorAll('#params-container .key-value-row').forEach(row => {
            const inputs = row.querySelectorAll('.key-value-input');
            const key = inputs[0].value.trim();
            const value = inputs[1].value.trim();
            if (key) {
                params.push(`${key}=${encodeURIComponent(value)}`);
            }
        });

        // Add query parameters to URL
        if (params.length > 0) {
            url += (url.includes('?') ? '&' : '?') + params.join('&');
        }

        let curl = '';  // ประกาศตัวแปร curl นอก if-else

        const onos = document.getElementById("os-select").value;
        if (onos === "window") {
            curl = `curl.exe -X ${method} \\\n  '${url}'`;
        } else {
            curl = `curl -X ${method} \\\n  '${url}'`;
        }

        // Add headers
        document.querySelectorAll('#headers-container .key-value-row').forEach(row => {
            const inputs = row.querySelectorAll('.key-value-input');
            const key = inputs[0].value.trim();
            const value = inputs[1].value.trim();
            if (key && value) {
                curl += ` \\\n  -H '${key}: ${value}'`;
            }
        });

        // Add cookies
        const cookies = [];
        document.querySelectorAll('#cookies-container .key-value-row').forEach(row => {
            const inputs = row.querySelectorAll('.key-value-input');
            const name = inputs[0].value.trim();
            const value = inputs[1].value.trim();
            if (name && value) {
                cookies.push(`${name}=${value}`);
            }
        });

        if (cookies.length > 0) {
            curl += ` \\\n  -H 'Cookie: ${cookies.join('; ')}'`;
        }

        // Add authentication
        const authType = document.getElementById('auth-type').value;
        if (authType === 'basic') {
            const inputs = document.querySelectorAll('#auth-fields .key-value-input');
            const username = inputs[0]?.value.trim() || '';
            const password = inputs[1]?.value.trim() || '';
            if (username && password) {
                curl += ` \\\n  -u '${username}:${password}'`;
            }
        } else if (authType === 'bearer') {
            const token = document.querySelector('#auth-fields .key-value-input')?.value.trim() || '';
            if (token) {
                curl += ` \\\n  -H 'Authorization: Bearer ${token}'`;
            }
        } else if (authType === 'api-key') {
            const inputs = document.querySelectorAll('#auth-fields .key-value-input');
            const keyName = inputs[0]?.value.trim() || '';
            const keyValue = inputs[1]?.value.trim() || '';
            const sendIn = inputs[2]?.value || 'header';

            if (keyName && keyValue) {
                if (sendIn === 'header') {
                    curl += ` \\\n  -H '${keyName}: ${keyValue}'`;
                } else if (sendIn === 'query') {
                    // ถ้าเป็น query parameter ให้ต่อ URL ใหม่และแก้ curl อีกที
                    // ลบ query string เก่าออกก่อน
                    const baseUrl = url.split('?')[0];
                    const existingParams = url.includes('?') ? url.split('?')[1] : '';
                    let newParams = existingParams ? existingParams + `&${keyName}=${encodeURIComponent(keyValue)}` : `${keyName}=${encodeURIComponent(keyValue)}`;
                    const newUrl = `${baseUrl}?${newParams}`;

                    // เปลี่ยน URL ในคำสั่ง curl
                    curl = curl.replace(url, newUrl);
                    url = newUrl; // อัพเดต url ตัวแปรไว้ใช้ต่อ
                }
            }
        }

        // Add body for POST, PUT, PATCH
        const requestBody = document.getElementById('request-body').value.trim();
        if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && requestBody) {
            try {
                JSON.parse(requestBody); // Validate JSON
                curl += ` \\\n  -d '${requestBody}'`;
            } catch (e) {
                alert('Invalid JSON in request body');
                return;
            }
        }

        document.getElementById('curl-command').textContent = curl;
    });


    // Copy to clipboard
    document.getElementById('copy-curl').addEventListener('click', function () {
        let curlCommand = document.getElementById('curl-command').textContent;

        curlCommand = curlCommand
            .split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .join(' ');

        navigator.clipboard.writeText(curlCommand).then(() => {
            const originalText = this.innerHTML;
            this.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Copied!
        `;
            setTimeout(() => {
                this.innerHTML = originalText;
            }, 2000);
        });
    });


    // Method color change
    document.getElementById('method').addEventListener('change', function () {
        const colors = {
            'GET': '#4CAF50',
            'POST': '#2196F3',
            'PUT': '#FF9800',
            'DELETE': '#F44336',
            'PATCH': '#9C27B0'
        };
        this.style.color = colors[this.value];
    });

    // Initialize method color
    document.getElementById('method').dispatchEvent(new Event('change'));

    // Initialize auth fields
    document.getElementById('auth-type').dispatchEvent(new Event('change'));
});