// Обработка формы отслеживания
document.getElementById('trackingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const trackingNumber = document.getElementById('trackingNumber').value;
    await trackPackage(trackingNumber);
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
        <div class="row">
            <div class="col-md-6">
                <p><strong>Номер отслеживания:</strong> ${package.tracking_number}</p>
                <p><strong>Отправитель:</strong> ${package.sender_name}</p>
                <p><strong>Адрес отправителя:</strong> ${package.sender_address}</p>
                <p><strong>Получатель:</strong> ${package.recipient_name}</p>
                <p><strong>Адрес получателя:</strong> ${package.recipient_address}</p>
                <p><strong>Текущий статус:</strong> ${translateStatus(package.current_status)}</p>
            </div>
            <div class="col-md-6 text-center">
                <div id="packageQRCode"></div>
                <button class="btn btn-primary mt-3" onclick="printPackageQR()">Распечатать QR-код</button>
            </div>
        </div>
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
    
    // Генерируем QR-код для посылки
    fetch(`/packages/${package.tracking_number}/qr`)
        .then(response => response.blob())
        .then(blob => {
            const imageUrl = URL.createObjectURL(blob);
            document.getElementById('packageQRCode').innerHTML = `<img src="${imageUrl}" alt="QR Code" class="img-fluid">`;
        });
    
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

// Обработка загрузки QR-кода
document.getElementById('qrUploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('qrFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Пожалуйста, выберите файл');
        return;
    }
    
    try {
        // Создаем временный элемент для сканера
        const tempDiv = document.createElement('div');
        tempDiv.id = 'temp-qr-scanner';
        document.body.appendChild(tempDiv);
        
        // Создаем экземпляр сканера с указанием ID элемента
        const html5QrCode = new Html5Qrcode('temp-qr-scanner');
        
        console.log('Начинаем сканирование файла...');
        // Сканируем файл
        const result = await html5QrCode.scanFile(file, true);
        console.log('Результат сканирования:', result);
        
        // Удаляем временный элемент
        document.body.removeChild(tempDiv);
        
        if (!result) {
            throw new Error('Результат сканирования пуст');
        }
        
        console.log('Тип результата:', typeof result);
        console.log('Содержимое результата:', result);
        
        // Проверяем наличие текста в результате
        if (typeof result === 'string') {
            console.log('Результат является строкой:', result);
            const trackingNumber = result.split(':')[1];
            if (trackingNumber) {
                console.log('Найден номер отслеживания:', trackingNumber);
                document.getElementById('number-tab').click();
                document.getElementById('trackingNumber').value = trackingNumber;
                await trackPackage(trackingNumber);
            } else {
                throw new Error('Не удалось найти номер отслеживания в QR-коде');
            }
        } else if (result.text) {
            console.log('Результат содержит text:', result.text);
            const trackingNumber = result.text.split(':')[1];
            if (trackingNumber) {
                console.log('Найден номер отслеживания:', trackingNumber);
                document.getElementById('number-tab').click();
                document.getElementById('trackingNumber').value = trackingNumber;
                await trackPackage(trackingNumber);
            } else {
                throw new Error('Не удалось найти номер отслеживания в QR-коде');
            }
        } else {
            console.log('Неизвестный формат результата:', result);
            throw new Error('QR-код не содержит данных');
        }
    } catch (error) {
        console.error('Ошибка при чтении QR-кода:', error);
        alert('Не удалось прочитать QR-код. Пожалуйста, убедитесь, что файл содержит корректный QR-код.');
    }
});

// Функция для отслеживания посылки
async function trackPackage(trackingNumber) {
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
}

// Функция для печати QR-кода посылки
function printPackageQR() {
    const printWindow = window.open('', '_blank');
    const qrImage = document.querySelector('#packageQRCode img').src;
    
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