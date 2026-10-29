// ============================================
// 1. STORAGE HELPERS
// ============================================

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved === null ? fallback : JSON.parse(saved);
    } catch (error) {
        console.error("Could not load " + key, error);
        return fallback;
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Could not save " + key, error);
        alert("Your data could not be saved in this browser.");
        return false;
    }
}

function createId() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}


// ============================================
// 2. DISPLAY DATE
// ============================================

document.getElementById("current-date").textContent =
    new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });


// ============================================
// 3. SIDEBAR NAVIGATION
// ============================================

const navigationButtons =
    document.querySelectorAll(".nav-button");

const sections =
    document.querySelectorAll(".app-section");

const pageTitle = document.getElementById("page-title");

function showSection(sectionName) {
    sections.forEach(function (section) {
        section.classList.toggle(
            "hidden",
            section.id !== sectionName + "-section"
        );
    });

    navigationButtons.forEach(function (button) {
        const isActive = button.dataset.section === sectionName;

        button.classList.toggle("active", isActive);
        button.setAttribute("aria-current", isActive ? "page" : "false");
    });

    const activeButton = Array.from(navigationButtons).find(
        button => button.dataset.section === sectionName
    );

    if (activeButton) {
        pageTitle.textContent = activeButton.textContent.trim();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

navigationButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        showSection(button.dataset.section);
    });
});


// ============================================
// 4. LOAD APPLICATION DATA
// ============================================

let tasks = loadData("studyBoardTasks", []);
let sessions = loadData("studyBoardSessions", []);
let subjects = loadData("studyBoardSubjects", null);
let notes = loadData("studyBoardNotes", []);
let studyRecords = loadData("studyBoardStudyRecords", []);

if (!Array.isArray(tasks)) tasks = [];
if (!Array.isArray(sessions)) sessions = [];
if (!Array.isArray(notes)) notes = [];
if (!Array.isArray(studyRecords)) studyRecords = [];

if (!Array.isArray(subjects)) {
    subjects = [
        { id: createId(), name: "Mathematics", chapters: [] },
        { id: createId(), name: "Physics", chapters: [] },
        { id: createId(), name: "Chemistry", chapters: [] },
        { id: createId(), name: "Computer Science", chapters: [] },
        { id: createId(), name: "English", chapters: [] }
    ];

    saveData("studyBoardSubjects", subjects);
}


// ============================================
// 5. SUBJECT DROPDOWNS
// ============================================

function populateSubjectDropdowns() {
    const dropdownIds = [
        "task-subject",
        "session-subject",
        "timer-subject"
    ];

    dropdownIds.forEach(function (id) {
        const dropdown = document.getElementById(id);
        const previousValue = dropdown.value;

        dropdown.replaceChildren();

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Choose subject";
        dropdown.appendChild(placeholder);

        subjects.forEach(function (subject) {
            const option = document.createElement("option");
            option.value = subject.name;
            option.textContent = subject.name;
            dropdown.appendChild(option);
        });

        if (subjects.some(subject => subject.name === previousValue)) {
            dropdown.value = previousValue;
        }
    });
}


// ============================================
// 6. TASK MANAGER
// ============================================

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskSubject = document.getElementById("task-subject");
const taskDeadline = document.getElementById("task-deadline");
const taskList = document.getElementById("task-list");
const emptyMessage = document.getElementById("empty-message");

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = taskInput.value.trim();
    const subject = taskSubject.value;
    const deadline = taskDeadline.value;

    if (!name || !subject || !deadline) {
        alert("Please fill in all task details.");
        return;
    }

    tasks.push({
        id: createId(),
        name: name,
        subject: subject,
        deadline: deadline,
        completed: false
    });

    saveData("studyBoardTasks", tasks);
    taskForm.reset();
    renderTasks();
});

function renderTasks() {
    taskList.replaceChildren();

    emptyMessage.style.display =
        tasks.length === 0 ? "block" : "none";

    tasks.forEach(function (task) {
        const card = document.createElement("div");
        card.className = "task-item";

        if (task.completed) card.classList.add("completed");

        const details = document.createElement("div");
        details.className = "task-details";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = Boolean(task.completed);
        checkbox.setAttribute("aria-label", "Complete task");

        checkbox.addEventListener("change", function () {
            task.completed = checkbox.checked;
            saveData("studyBoardTasks", tasks);
            renderTasks();
        });

        const info = document.createElement("div");
        info.className = "task-info";

        const title = document.createElement("h3");
        title.textContent = task.name;

        const description = document.createElement("p");
        description.textContent =
            task.subject + " · Due: " + task.deadline;

        info.append(title, description);
        details.append(checkbox, info);

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            tasks = tasks.filter(item => item.id !== task.id);
            saveData("studyBoardTasks", tasks);
            renderTasks();
        });

        card.append(details, deleteButton);
        taskList.appendChild(card);
    });

    renderDashboard();
    renderProgress();
}


// ============================================
// 7. TIMETABLE
// ============================================

const timetableForm = document.getElementById("timetable-form");
const sessionNameInput = document.getElementById("session-name");
const sessionSubjectInput = document.getElementById("session-subject");
const sessionStartInput = document.getElementById("session-start");
const sessionEndInput = document.getElementById("session-end");
const timetableList = document.getElementById("timetable-list");
const emptyTimetable = document.getElementById("empty-timetable");

timetableForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = sessionNameInput.value.trim();
    const subject = sessionSubjectInput.value;
    const start = sessionStartInput.value;
    const end = sessionEndInput.value;

    if (!name || !subject || !start || !end) {
        alert("Please fill in all session details.");
        return;
    }

    if (start >= end) {
        alert("The end time must be later than the start time.");
        return;
    }

    sessions.push({
        id: createId(),
        name: name,
        subject: subject,
        start: start,
        end: end
    });

    saveData("studyBoardSessions", sessions);
    timetableForm.reset();
    renderTimetable();
});

function renderTimetable() {
    timetableList.replaceChildren();

    emptyTimetable.style.display =
        sessions.length === 0 ? "block" : "none";

    const sorted = [...sessions].sort(
        (a, b) => a.start.localeCompare(b.start)
    );

    sorted.forEach(function (session) {
        const card = document.createElement("div");
        card.className = "session-card";

        const info = document.createElement("div");
        info.className = "session-info";

        const title = document.createElement("h3");
        title.textContent = session.name;

        const details = document.createElement("p");
        details.textContent =
            session.subject + " · " + session.start + "–" + session.end;

        const duration = document.createElement("p");
        const startMinutes = timeToMinutes(session.start);
        const endMinutes = timeToMinutes(session.end);

        duration.textContent =
            "Scheduled duration: " +
            formatMinutes(endMinutes - startMinutes);

        info.append(title, details, duration);

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            sessions = sessions.filter(item => item.id !== session.id);
            saveData("studyBoardSessions", sessions);
            renderTimetable();
        });

        card.append(info, deleteButton);
        timetableList.appendChild(card);
    });

    renderDashboard();
}

function timeToMinutes(time) {
    const parts = time.split(":").map(Number);
    return parts[0] * 60 + parts[1];
}

function formatMinutes(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) return remainingMinutes + " minutes";

    if (remainingMinutes === 0) return hours + " hour(s)";

    return hours + " hour(s) " + remainingMinutes + " min";
}


// ============================================
// 8. SUBJECT TRACKER
// ============================================

const subjectForm = document.getElementById("subject-form");
const subjectInput = document.getElementById("subject-input");
const subjectList = document.getElementById("subject-list");
const emptySubjects = document.getElementById("empty-subjects");

subjectForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = subjectInput.value.trim();

    if (!name) return;

    const exists = subjects.some(
        subject => subject.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
        alert("That subject already exists.");
        return;
    }

    subjects.push({
        id: createId(),
        name: name,
        chapters: []
    });

    saveData("studyBoardSubjects", subjects);
    subjectForm.reset();
    renderSubjects();
});

function renderSubjects() {
    subjectList.replaceChildren();

    emptySubjects.style.display =
        subjects.length === 0 ? "block" : "none";

    subjects.forEach(function (subject) {
        const card = document.createElement("div");
        card.className = "subject-card";

        const info = document.createElement("div");
        info.className = "subject-info";

        const title = document.createElement("h3");
        title.textContent = subject.name;

        const count = document.createElement("p");
        count.textContent =
            subject.chapters.length + " chapter(s) added";

        const chapters = document.createElement("ul");
        chapters.className = "chapter-list";

        subject.chapters.forEach(function (chapter, index) {
            const item = document.createElement("li");
            item.textContent = chapter + " ";

            const removeChapter = document.createElement("button");
            removeChapter.className = "delete-button";
            removeChapter.textContent = "Remove";

            removeChapter.addEventListener("click", function () {
                subject.chapters.splice(index, 1);
                saveData("studyBoardSubjects", subjects);
                renderSubjects();
            });

            item.appendChild(removeChapter);
            chapters.appendChild(item);
        });

        const chapterForm = document.createElement("form");
        chapterForm.className = "chapter-form";

        const chapterInput = document.createElement("input");
        chapterInput.type = "text";
        chapterInput.placeholder = "Add a chapter";
        chapterInput.required = true;

        const addChapterButton = document.createElement("button");
        addChapterButton.type = "submit";
        addChapterButton.className = "primary-button";
        addChapterButton.textContent = "Add Chapter";

        chapterForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const chapterName = chapterInput.value.trim();
            if (!chapterName) return;

            subject.chapters.push(chapterName);
            saveData("studyBoardSubjects", subjects);
            renderSubjects();
        });

        chapterForm.append(chapterInput, addChapterButton);

        const deleteSubjectButton = document.createElement("button");
        deleteSubjectButton.className = "delete-button";
        deleteSubjectButton.textContent = "Delete Subject";

        deleteSubjectButton.addEventListener("click", function () {
            const confirmed = confirm(
                "Delete " + subject.name + "? Related tasks and sessions will not be deleted."
            );

            if (!confirmed) return;

            subjects = subjects.filter(item => item.id !== subject.id);
            saveData("studyBoardSubjects", subjects);

            populateSubjectDropdowns();
            renderSubjects();
        });

        info.append(title, count, chapters, chapterForm);
        card.append(info, deleteSubjectButton);
        subjectList.appendChild(card);
    });

    populateSubjectDropdowns();
    renderDashboard();
    renderProgress();
}


// ============================================
// 9. STUDY TIMER
// ============================================

const timerDisplay = document.getElementById("timer-display");
const timerSubject = document.getElementById("timer-subject");
const timerStart = document.getElementById("timer-start");
const timerPause = document.getElementById("timer-pause");
const timerResume = document.getElementById("timer-resume");
const timerSave = document.getElementById("timer-save");
const timerReset = document.getElementById("timer-reset");
const timerStatus = document.getElementById("timer-status");

const studySessionList = document.getElementById("study-session-list");
const emptyStudySessions = document.getElementById("empty-study-sessions");

let timerInterval = null;
let timerStartedAt = null;
let elapsedBeforeStart = 0;
let timerState = "idle";

function elapsedMilliseconds() {
    if (timerState === "running" && timerStartedAt !== null) {
        return elapsedBeforeStart + (Date.now() - timerStartedAt);
    }

    return elapsedBeforeStart;
}

function formatTimer(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
        .map(value => String(value).padStart(2, "0"))
        .join(":");
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTimer(elapsedMilliseconds());
}

function updateTimerButtons() {
    timerStart.disabled = timerState !== "idle";
    timerPause.disabled = timerState !== "running";
    timerResume.disabled = timerState !== "paused";
    timerSave.disabled =
        timerState === "idle" || elapsedMilliseconds() < 1000;
}

function stopTimerInterval() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

timerStart.addEventListener("click", function () {
    if (!timerSubject.value) {
        alert("Choose a subject before starting the timer.");
        return;
    }

    elapsedBeforeStart = 0;
    timerStartedAt = Date.now();
    timerState = "running";

    timerInterval = setInterval(function () {
        updateTimerDisplay();
        updateTimerButtons();
    }, 250);

    timerStatus.textContent = "Study session in progress.";
    updateTimerButtons();
});

timerPause.addEventListener("click", function () {
    if (timerState !== "running") return;

    elapsedBeforeStart += Date.now() - timerStartedAt;
    timerStartedAt = null;
    timerState = "paused";

    stopTimerInterval();
    updateTimerDisplay();
    updateTimerButtons();

    timerStatus.textContent = "Timer paused.";
});

timerResume.addEventListener("click", function () {
    if (timerState !== "paused") return;

    if (!timerSubject.value) {
        alert("Choose a subject before resuming.");
        return;
    }

    timerStartedAt = Date.now();
    timerState = "running";

    timerInterval = setInterval(function () {
        updateTimerDisplay();
        updateTimerButtons();
    }, 250);

    timerStatus.textContent = "Study session resumed.";
    updateTimerButtons();
});

timerSave.addEventListener("click", function () {
    if (timerState === "idle") return;

    const milliseconds = elapsedMilliseconds();
    const minutes = Math.floor(milliseconds / 60000);

    if (minutes < 1) {
        alert("Study for at least one minute before saving a session.");
        return;
    }

    const subject = timerSubject.value;

    if (!subject) {
        alert("Choose a subject before saving.");
        return;
    }

    const record = {
        id: createId(),
        subject: subject,
        minutes: minutes,
        date: new Date().toISOString()
    };

    studyRecords.push(record);
    saveData("studyBoardStudyRecords", studyRecords);

    stopTimerInterval();
    elapsedBeforeStart = 0;
    timerStartedAt = null;
    timerState = "idle";

    updateTimerDisplay();
    updateTimerButtons();
    renderStudyRecords();

    timerStatus.textContent =
        "Saved " + formatMinutes(minutes) + " of study time.";

    renderDashboard();
    renderProgress();
});

timerReset.addEventListener("click", function () {
    const hasElapsed = elapsedMilliseconds() > 0;

    if (hasElapsed && !confirm("Reset this timer without saving its time?")) {
        return;
    }

    stopTimerInterval();

    elapsedBeforeStart = 0;
    timerStartedAt = null;
    timerState = "idle";

    updateTimerDisplay();
    updateTimerButtons();

    timerStatus.textContent = "Timer reset.";
});

function renderStudyRecords() {
    studySessionList.replaceChildren();

    emptyStudySessions.style.display =
        studyRecords.length === 0 ? "block" : "none";

    [...studyRecords].reverse().forEach(function (record) {
        const card = document.createElement("div");
        card.className = "study-session-card";

        const info = document.createElement("div");
        info.className = "session-info";

        const title = document.createElement("h3");
        title.textContent = record.subject;

        const date = document.createElement("p");
        date.textContent =
            new Date(record.date).toLocaleString("en-IN");

        const duration = document.createElement("p");
        duration.textContent = "Study time: " + formatMinutes(record.minutes);

        info.append(title, date, duration);

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            studyRecords = studyRecords.filter(
                item => item.id !== record.id
            );

            saveData("studyBoardStudyRecords", studyRecords);
            renderStudyRecords();
            renderDashboard();
            renderProgress();
        });

        card.append(info, deleteButton);
        studySessionList.appendChild(card);
    });
}


// ============================================
// 10. NOTES
// ============================================

const noteForm = document.getElementById("note-form");
const noteIdInput = document.getElementById("note-id");
const noteTitleInput = document.getElementById("note-title");
const noteContentInput = document.getElementById("note-content");
const noteSaveButton = document.getElementById("note-save-button");
const noteCancelButton = document.getElementById("note-cancel-button");
const notesList = document.getElementById("notes-list");
const emptyNotes = document.getElementById("empty-notes");

noteForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();

    if (!title || !content) {
        alert("Please enter a title and note.");
        return;
    }

    const editingId = noteIdInput.value;

    if (editingId) {
        const note = notes.find(item => item.id === editingId);

        if (note) {
            note.title = title;
            note.content = content;
            note.updatedAt = new Date().toISOString();
        }
    } else {
        notes.push({
            id: createId(),
            title: title,
            content: content,
            updatedAt: new Date().toISOString()
        });
    }

    saveData("studyBoardNotes", notes);
    resetNoteForm();
    renderNotes();
});

function resetNoteForm() {
    noteForm.reset();
    noteIdInput.value = "";
    noteSaveButton.textContent = "Save Note";
    noteCancelButton.style.display = "none";
}

noteCancelButton.addEventListener("click", resetNoteForm);

function renderNotes() {
    notesList.replaceChildren();

    emptyNotes.style.display =
        notes.length === 0 ? "block" : "none";

    [...notes].reverse().forEach(function (note) {
        const card = document.createElement("div");
        card.className = "note-card";

        const info = document.createElement("div");
        info.className = "note-info";

        const title = document.createElement("h3");
        title.textContent = note.title;

        const content = document.createElement("p");
        content.textContent = note.content;

        const updated = document.createElement("p");
        updated.textContent =
            "Updated: " + new Date(note.updatedAt).toLocaleString("en-IN");

        info.append(title, content, updated);

        const actions = document.createElement("div");
        actions.className = "item-actions";

        const editButton = document.createElement("button");
        editButton.className = "secondary-button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function () {
            noteIdInput.value = note.id;
            noteTitleInput.value = note.title;
            noteContentInput.value = note.content;
            noteSaveButton.textContent = "Update Note";
            noteCancelButton.style.display = "inline-block";

            showSection("notes");
            noteTitleInput.focus();
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            notes = notes.filter(item => item.id !== note.id);
            saveData("studyBoardNotes", notes);
            renderNotes();
        });

        actions.append(editButton, deleteButton);
        card.append(info, actions);
        notesList.appendChild(card);
    });
}


// ============================================
// 11. DASHBOARD
// ============================================

function renderDashboard() {
    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
        task => task.completed
    ).length;

    const percentage = totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    const totalStudyMinutes = studyRecords.reduce(
        (sum, record) => sum + Number(record.minutes || 0),
        0
    );

    document.getElementById("total-tasks").textContent = totalTasks;
    document.getElementById("completed-tasks").textContent = completedTasks;
    document.getElementById("daily-progress").textContent = percentage + "%";

    document.getElementById("study-hours").textContent =
        (totalStudyMinutes / 60).toFixed(1);

    // Task preview
    const taskPreview = document.getElementById("dashboard-task-preview");
    taskPreview.replaceChildren();

    const pendingTasks = tasks.filter(task => !task.completed).slice(0, 5);

    if (pendingTasks.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No pending tasks. Great work!";
        taskPreview.appendChild(message);
    } else {
        pendingTasks.forEach(function (task) {
            const item = document.createElement("p");
            item.textContent =
                task.name + " · " + task.subject + " · Due " + task.deadline;
            taskPreview.appendChild(item);
        });
    }

    // Timetable preview
    const timetablePreview =
        document.getElementById("dashboard-timetable-preview");

    timetablePreview.replaceChildren();

    const upcoming = [...sessions].sort(
        (a, b) => a.start.localeCompare(b.start)
    ).slice(0, 5);

    if (upcoming.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No study sessions scheduled yet.";
        timetablePreview.appendChild(message);
    } else {
        upcoming.forEach(function (session) {
            const item = document.createElement("p");
            item.textContent =
                session.start + "–" + session.end +
                " · " + session.name + " (" + session.subject + ")";
            timetablePreview.appendChild(item);
        });
    }
}


// ============================================
// 12. PROGRESS TRACKER
// ============================================

function renderProgress() {
    const completed = tasks.filter(task => task.completed).length;
    const total = tasks.length;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    const studyMinutes = studyRecords.reduce(
        (sum, record) => sum + Number(record.minutes || 0),
        0
    );

    document.getElementById("progress-task-summary").textContent =
        completed + " out of " + total + " tasks completed";

    document.getElementById("progress-percentage").textContent =
        percentage + "%";

    document.getElementById("progress-bar").style.width =
        percentage + "%";

    document.getElementById("progress-study-time").textContent =
        (studyMinutes / 60).toFixed(1) + " hours";

    document.getElementById("progress-subject-count").textContent =
        subjects.length + " subject(s) added";
}


// ============================================
// 13. INITIALISE THE APPLICATION
// ============================================

populateSubjectDropdowns();
renderTasks();
renderTimetable();
renderSubjects();
renderStudyRecords();
renderNotes();
renderProgress();
renderDashboard();
updateTimerDisplay();
updateTimerButtons();
showSection("dashboard");

console.log("StudyBoard is ready!");