// Обработка формы отслеживания
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

// Обработка формы создания посылки
document.getElementById('createPackageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const packageData = {
        sender_name: document.getElementById('senderName').value,
        sender_address: document.getElementById('senderAddress').value,
        recipient_name: document.getElementById('recipientName').value,
        recipient_address: document.getElementById('recipientAddress').value
    };
    
    try {
        const response = await fetch('/packages/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(packageData)
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при создании посылки');
        }
        
        const newPackage = await response.json();
        displayNewPackage(newPackage);
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

function displayNewPackage(package) {
    const resultDiv = document.getElementById('createResult');
    const packageInfo = document.getElementById('newPackageInfo');
    const qrCodeDiv = document.getElementById('qrCode');
    
    // Отображаем информацию о новой посылке
    packageInfo.innerHTML = `
        <p><strong>Номер отслеживания:</strong> ${package.tracking_number}</p>
        <p><strong>Отправитель:</strong> ${package.sender_name}</p>
        <p><strong>Адрес отправителя:</strong> ${package.sender_address}</p>
        <p><strong>Получатель:</strong> ${package.recipient_name}</p>
        <p><strong>Адрес получателя:</strong> ${package.recipient_address}</p>
        <p><strong>Статус:</strong> ${translateStatus(package.current_status)}</p>
    `;
    
    // Генерируем QR-код
    fetch(`/packages/${package.tracking_number}/qr`)
        .then(response => response.blob())
        .then(blob => {
            const imageUrl = URL.createObjectURL(blob);
            qrCodeDiv.innerHTML = `<img src="${imageUrl}" alt="QR Code" class="img-fluid">`;
        });
    
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

function printQR() {
    const printWindow = window.open('', '_blank');
    const qrImage = document.querySelector('#qrCode img').src;
    
    printWindow.document.write(`
        <html>
            <head>
                <title>QR-код посылки</title>
                <style>
                    body { text-align: center; }
                    img { max-width: 300px; }
                </style>
            </head>
            <body>
                <img src="${qrImage}" alt="QR Code">
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
        </html>
    `);
} 