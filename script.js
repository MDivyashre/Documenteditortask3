 const socket = io('http://localhost:5000');
        let currentRoom = null;
        let userId = 'user_' + Math.random().toString(36).substr(2, 9);
        let userName = 'User ' + Math.floor(Math.random() * 1000);
        let cursors = {};

        const editor = document.getElementById('editor');
        const roomInfo = document.getElementById('roomInfo');
        const roomInput = document.getElementById('roomInput');
        const joinBtn = document.getElementById('joinBtn');
        const usersList = document.getElementById('usersList');
        const connectionStatus = document.getElementById('connectionStatus');

        // Socket events
        socket.on('connect', () => {
            connectionStatus.textContent = '🟢 Connected';
            connectionStatus.className = 'connected';
        });

        socket.on('init-content', (content) => {
            editor.value = content;
            updateCharCount();
        });

        socket.on('content-update', (data) => {
            if (data.userId !== userId) {
                editor.value = data.content;
            }
        });

        socket.on('user-joined', (users) => {
            updateUsersList(users);
        });

        socket.on('cursor-update', (cursorsData) => {
            updateCursors(cursorsData);
        });

        // Room management
        function createRoom() {
            currentRoom = 'room_' + Math.random().toString(36).substr(2, 9);
            joinRoom(currentRoom);
        }

        function joinRoom(roomId = null) {
            if (roomId) {
                currentRoom = roomId;
            } else {
                currentRoom = roomInput.value.trim();
            }
            
            if (currentRoom) {
                socket.emit('join-room', currentRoom);
                roomInfo.textContent = `Room: ${currentRoom}`;
                roomInput.style.display = 'none';
                joinBtn.style.display = 'none';
            }
        }

        // Editor events
        editor.addEventListener('input', (e) => {
            if (currentRoom) {
                socket.emit('content-change', {
                    roomId: currentRoom,
                    content: e.target.value,
                    userId: userId
                });
                updateCharCount();
                document.getElementById('lastSaved').textContent = 'now';
            }
        });

        editor.addEventListener('keydown', (e) => {
            updateCursorPosition();
        });

        editor.addEventListener('keyup', updateCursorPosition);

        // Toolbar functions
        function formatText(command) {
            document.execCommand(command, false, null);
            editor.focus();
        }

        function changeFontSize(size) {
            document.execCommand('fontSize', false, size);
            editor.focus();
        }

        function exportDoc() {
            const content = editor.value;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `collabdoc-${currentRoom}.txt`;
            a.click();
        }

        // Cursor tracking
        function updateCursorPosition() {
            const rect = editor.getBoundingClientRect();
            const range = window.getSelection().getRangeAt(0);
            const cursorPos = range.getBoundingClientRect();
            
            socket.emit('cursor-move', {
                roomId: currentRoom,
                x: cursorPos.left - rect.left + window.scrollX,
                y: cursorPos.top - rect.top + window.scrollY,
                userId: userId
            });
        }

        function updateCursors(cursorsData) {
            const cursorsContainer = document.getElementById('cursors');
            cursorsContainer.innerHTML = '';
            
            Object.entries(cursorsData).forEach(([userId, pos]) => {
                if (userId !== this.userId && pos) {
                    const cursor = document.createElement('div');
                    cursor.className = 'user-cursor';
                    cursor.style.left = pos.x + 'px';
                    cursor.style.top = pos.y + 'px';
                    cursor.style.width = '20px';
                    cursor.title = `User ${userId.slice(0,4)}`;
                    cursorsContainer.appendChild(cursor);
                }
            });
        }

        function updateUsersList(users) {
            usersList.innerHTML = '';
            Object.entries(users).forEach(([id, name]) => {
                const userDiv = document.createElement('div');
                userDiv.className = 'user-item';
                userDiv.innerHTML = `
                    <div class="user-avatar">${name.charAt(0)}</div>
                    <span>${name}</span>
                    <span style="margin-left: auto; font-size: 12px; color: #666;">${id.slice(0,6)}</span>
                `;
                usersList.appendChild(userDiv);
            });
        }

        function updateCharCount() {
            document.getElementById('charCount').textContent = 
                `${editor.value.length} characters`;
        }

        // Enter key for room input
        roomInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') joinRoom();
        });

        // Auto-focus editor
        editor.focus();