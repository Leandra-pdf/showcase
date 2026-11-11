const btn = document.getElementById("baton");
const input = document.getElementById("content");
const chatWindow = document.getElementById("chat-window");

// Helper: adds a chat bubble to the chat window.
function addMessage(text, sender) {
    const bubble = document.createElement("div");
    bubble.className = sender === "user" ? "chat-bubble user-bubble" : "chat-bubble ai-bubble";

    if (sender === "ai" && typeof marked !== "undefined") {
        bubble.innerHTML = marked.parse(text);
    } else {
        bubble.textContent = text;
    }

    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    // auto-scroll to newest message
}

// AI chat send button
btn.addEventListener('click', function(){
    sendMessage();
});

input.addEventListener('keydown', function(e){
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const userText = input.value;
    if (!userText.trim()) {
        return;
    }

    addMessage(userText, "user");
    input.value = '';

    fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": API_KEY
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: userText
                }]
            }]
        })
    }).then((res) => {
        return res.json();
    }).then((json) => {
        console.log(json);
        if (json.candidates && json.candidates[0]) {
            const resText = json.candidates[0].content.parts[0].text;
            addMessage(resText, "ai");
        } else if (json.error) {
            console.error("API error:", json.error);
            addMessage("Sorry, I'm feeling sick. Let's talk later! 🤒", "ai");
        }
    }).catch((err) => {
        console.error("Fetch error:", err);
        addMessage("Sorry, I'm feeling sick. Let's talk later! 🤒", "ai");
    });
}

// Clear chat
const clearBtn = document.getElementById("clear-btn");

clearBtn.addEventListener('click', function() {
    chatWindow.innerHTML = '';
});

// Color Changer
const bgBtn = document.getElementById("bg-btn");

bgBtn.addEventListener('click', function() {
    document.body.classList.toggle('dark-theme');
});

// Show/Hide Paragraph
const toggleBtn = document.getElementById("toggle-btn");
const toggleText = document.getElementById("toggle-text");

toggleBtn.addEventListener('click', function() {
    if (toggleText.style.display === "none") {
        toggleText.style.display = "block";
        toggleBtn.textContent = "Hide Paragraph";
    } else {
        toggleText.style.display = "none";
        toggleBtn.textContent = "Show Paragraph";
    }
});