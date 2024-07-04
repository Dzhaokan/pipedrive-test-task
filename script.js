document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('jobForm');
    const loadingSpinner = document.getElementById('loading');
    const mainContainer = document.getElementById('mainContainer');
    const successMessage = document.getElementById('successMessage');
    const dealLink = document.getElementById('dealLink');
    const backButton = document.getElementById('backButton');

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        loadingSpinner.style.display = 'block';
        mainContainer.classList.add('blur');

        const formData = new FormData(form);
        const apiToken = formData.get('apiToken');
        const baseUrl = formData.get('baseUrl');

        if (![...formData.values()].every(value => value.trim() !== '')) {
            alert('Please fill in all fields.');
            hideLoading();
            return;
        }

        try {
            const personId = await findOrCreatePerson(formData, apiToken, baseUrl);
            const dealId = await createDeal(formData, personId, apiToken, baseUrl);
            await createNote(formData, dealId, apiToken, baseUrl);

            showSuccessMessage(dealId, baseUrl);
        } catch (error) {
            console.error(error);
            alert('An error occurred while creating a deal.');
        } finally {
            hideLoading();
        }
    });

    backButton.addEventListener('click', function() {
        location.reload();
    });

    function hideLoading() {
        loadingSpinner.style.display = 'none';
        mainContainer.classList.remove('blur');
    }

    async function findOrCreatePerson(formData, apiToken, baseUrl) {
        const fullName = `${formData.get('firstName')} ${formData.get('lastName')}`;
        const searchResponse = await axios.get(`${baseUrl}/v1/persons/search`, {
            params: { api_token: apiToken, term: fullName, fields: 'name' }
        });

        if (searchResponse.data.data.items.length > 0) {
            return searchResponse.data.data.items[0].item.id;
        } else {
            const personResponse = await axios.post(`${baseUrl}/v1/persons`, {
                api_token: apiToken,
                name: fullName,
                email: formData.get('email'),
                phone: formData.get('phone')
            });
            return personResponse.data.data.id;
        }
    }

    async function createDeal(formData, personId, apiToken, baseUrl) {
        const deal = {
            title: `Job type: ${formData.get('jobType')}, job source: ${formData.get('jobSource')}, job description: ${formData.get('jobDescription')}`,
            value: 0,
            currency: 'USD',
            person_id: personId,
            custom_fields: {
                // Add custom fields here
            }
        };

        const dealResponse = await axios.post(`${baseUrl}/v1/deals`, { ...deal, api_token: apiToken });
        return dealResponse.data.data.id;
    }

    async function createNote(formData, dealId, apiToken, baseUrl) {
        const noteContent = `first name - ${formData.get('firstName')}\nlast name - ${formData.get('lastName')}\nphone - ${formData.get('phone')}\nemail - ${formData.get('email')}\njob type - ${formData.get('jobType')}\njob description - ${formData.get('jobDescription')}\njob source - ${formData.get('jobSource')}\naddress - ${formData.get('address')}\ncity - ${formData.get('city')}\nstate - ${formData.get('state')}\nzip code - ${formData.get('zipCode')}\narea - ${formData.get('area')}\nstart date - ${formData.get('startDate')}\nstart time - ${formData.get('startTime')}\nend time - ${formData.get('endTime')}\ntest select - ${formData.get('testSelect')}`;

        const note = {
            content: noteContent,
            deal_id: dealId,
            pinned_to_deal_flag: true,
            api_token: apiToken
        };

        await axios.post(`${baseUrl}/v1/notes`, note);
    }

    function showSuccessMessage(dealId, baseUrl) {
        mainContainer.style.display = 'none';
        successMessage.style.display = 'block';
        dealLink.innerHTML = `<a href='${baseUrl}/deal/${dealId}' target='_blank'>View the deal</a>`;
    }
});