document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select (avoid duplicates on re-fetch)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4></h4>
          <p></p>
          <p><strong>Schedule:</strong> </p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <p class="participants-label"><strong>Participants:</strong></p>
          <ul class="participants-list"></ul>
        `;

        // Fill in text content to avoid accidental HTML injection
        activityCard.querySelector('h4').textContent = name;
        activityCard.querySelector('p').textContent = details.description;
        activityCard.querySelector('p strong').textContent = 'Schedule:';
        activityCard.querySelector('p').nextSibling && (activityCard.querySelector('p').nextSibling.textContent = '');

        const participantsUl = activityCard.querySelector('.participants-list');
        if (!details.participants || details.participants.length === 0) {
          const noPart = document.createElement('div');
          noPart.className = 'no-participants';
          noPart.textContent = 'No participants yet.';
          participantsUl.appendChild(noPart);
        } else {
          details.participants.forEach(participant => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const span = document.createElement('span');
            span.className = 'participant-email';
            span.textContent = participant;

            const btn = document.createElement('button');
            btn.className = 'delete-btn';
            btn.title = 'Unregister participant';
            btn.type = 'button';
            btn.textContent = '✖';

            // Attach data and handler
            btn.addEventListener('click', async () => {
              if (!confirm(`Unregister ${participant} from ${name}?`)) return;
              try {
                const res = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(participant)}`, { method: 'DELETE' });
                const result = await res.json();
                if (res.ok) {
                  messageDiv.textContent = result.message;
                  messageDiv.className = 'message success';
                  // Refresh activity list
                  fetchActivities();
                } else {
                  messageDiv.textContent = result.detail || 'Failed to unregister participant.';
                  messageDiv.className = 'message error';
                }
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 4000);
              } catch (err) {
                console.error('Error unregistering:', err);
                messageDiv.textContent = 'Failed to unregister. Please try again.';
                messageDiv.className = 'message error';
                messageDiv.classList.remove('hidden');
              }
            });

            li.appendChild(span);
            li.appendChild(btn);
            participantsUl.appendChild(li);
          });
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = 'message success';
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = 'message error';
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
