document.getElementById('trackingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const trackingNumber = document.getElementById('trackingNumber').value;
    
    try {
        const response = await fetch(`/packages/${trackingNumber}`);
        if (!response.ok) {
            throw new Error('Посылка не найдена');
        }
        
        const package = await response.json();
        displayPackageInfo(package);
    } catch (error) {
        alert(error.message);
    }
});

function displayPackageInfo(package) {
    const resultDiv = document.getElementById('trackingResult');
    const packageInfo = document.getElementById('packageInfo');
    const statusTimeline = document.getElementById('statusTimeline');
    
    // Отображаем основную информацию о посылке
    packageInfo.innerHTML = `
        <p><strong>Номер отслеживания:</strong> ${package.tracking_number}</p>
        <p><strong>Отправитель:</strong> ${package.sender_name}</p>
        <p><strong>Адрес отправителя:</strong> ${package.sender_address}</p>
        <p><strong>Получатель:</strong> ${package.recipient_name}</p>
        <p><strong>Адрес получателя:</strong> ${package.recipient_address}</p>
        <p><strong>Текущий статус:</strong> ${translateStatus(package.current_status)}</p>
    `;
    
    // Отображаем историю статусов
    statusTimeline.innerHTML = package.status_history
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(status => `
            <div class="timeline-item">
                <div class="timeline-date">${new Date(status.timestamp).toLocaleString()}</div>
                <div class="timeline-content">
                    <h6>${translateStatus(status.status)}</h6>
                    <p>${status.location}</p>
                    <p>${status.description}</p>
                </div>
            </div>
        `).join('');
    
    resultDiv.classList.remove('d-none');
}

function translateStatus(status) {
    const statusMap = {
        'created': 'Создана',
        'in_transit': 'В пути',
        'delivered': 'Доставлена',
        'returned': 'Возвращена'
    };
    return statusMap[status] || status;
} 