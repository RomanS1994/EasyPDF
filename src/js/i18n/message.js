const lang = document.documentElement.lang || 'uk';

export const t = key => {
  return messages[lang] && messages[lang][key] ? messages[lang][key] : key;
};

export const messages = {
  uk: {
    invalid_phone_number:
      'Введіть правильний номер з кодом країни. Приклад: +420773633433',
    form_complete: 'Будь ласка, заповніть всі поля форми.',
    invalid_email: 'Будь ласка, введіть дійсну електронну адресу!',
    select_fromAdress: 'Будь ласка, виберіть пункт посадки',
    select_toAdress: 'Будь ласка, виберіть пункт висадки',
    confirm_payment: 'Будь ласка, підтвердіть спосіб оплати!',
    form_sent: 'Форма була успішно відправлена ✅',
    email_error: 'Сталася помилка під час відправки електронної пошти!',
    select_car: 'Будь ласка, виберіть тип авто',
    pdf_upload_failed: 'Не вдалося завантажити PDF на сервер. Перевір консоль.',
    choose_pickup_A:
      '👉 Натисни на мапі, щоб вибрати пункт посадки (Маркер A).',
    choose_pickup_B:
      '👉 Натисни на мапі, щоб вибрати пункт посадки (Маркер B).',
    geolocation_failed: '⚠️ Не вдалося отримати ваше місцезнаходження.',
    geolocation_not_supported: '⚠️ Ваш браузер не підтримує геолокацію.',
    code_sent: '📩 Код відправлено!',
    send_again: '🔁 Надіслати ще раз',
    code_send_error: '⚠️ Сталася помилка при відправленні коду.',
    number_confirmed: '✅ Номер підтверджено',
    code_expired: '⏱️ Код прострочено. Будь ласка, запросіть новий.',
    incorrect_code: '❌ Неправильний код. Спробуйте ще раз.',
    verification_failed: '⚠️ Помилка верифікації. Спробуйте ще раз.',
    flight_number_required: 'Потрібно вказати номер рейсу.',
    trip_time_min_one_hour:
      'Будь ласка, оберіть час щонайменше за 1 годину від поточного.',
  },
  en: {
    invalid_phone_number:
      'Enter a valid number with the country code. Example: +420773633433',
    form_complete: 'Please complete all fields in the form.',
    invalid_email: 'Please enter a valid email address!',
    select_fromAdress: 'Please select a pickup address',
    select_toAdress: 'Please select a drop-off address',
    confirm_payment: 'Please confirm your payment method!',
    form_sent: 'The form has been submitted successfully ✅',
    email_error: 'There was an error sending the email!',
    select_car: 'Please select a car type',
    pdf_upload_failed:
      "Couldn't upload the PDF to the server. Please check the console.",
    choose_pickup_A:
      '👉 Click on the map to choose the pickup point (Marker A).',
    choose_pickup_B:
      '👉 Click on the map to choose the pickup point (Marker B).',
    geolocation_failed: "⚠️ Couldn't get your location.",
    geolocation_not_supported: '⚠️ Your browser does not support geolocation.',
    code_sent: '📩 Code sent!',
    send_again: '🔁 Send again',
    code_send_error: '⚠️ An error occurred while sending the code.',
    number_confirmed: '✅ Number confirmed',
    code_expired: '⏱️ The code has expired. Please request a new one.',
    incorrect_code: '❌ Incorrect code. Please try again.',
    verification_failed: '⚠️ Verification failed. Please try again.',
    flight_number_required: 'Flight number is required.',
    trip_time_min_one_hour:
      'Please choose a time at least 1 hour from now.',
  },
  cs: {
    invalid_phone_number:
      'Zadejte platné číslo s předvolbou země. Příklad: +420773633433',
    form_complete: 'Vyplňte prosím všechna pole formuláře.',
    invalid_email: 'Zadejte platnou e-mailovou adresu!',
    select_fromAdress: 'Vyberte prosím adresu vyzvednutí',
    select_toAdress: 'Vyberte prosím adresu vysazení',
    confirm_payment: 'Potvrďte prosím způsob platby!',
    form_sent: 'Formulář byl úspěšně odeslán ✅',
    email_error: 'Při odesílání e-mailu došlo k chybě!',
    select_car: 'Vyberte prosím typ vozu',
    pdf_upload_failed:
      'Nepodařilo se nahrát PDF na server. Zkontrolujte konzoli.',
    choose_pickup_A: '👉 Klikněte na mapu pro výběr místa nástupu (Marker A).',
    choose_pickup_B: '👉 Klikněte na mapu pro výběr místa nástupu (Marker B).',
    geolocation_failed: '⚠️ Nepodařilo se získat vaši polohu.',
    geolocation_not_supported: '⚠️ Váš prohlížeč nepodporuje geolokaci.',
    code_sent: '📩 Kód odeslán!',
    send_again: '🔁 Odeslat znovu',
    code_send_error: '⚠️ Došlo k chybě při odesílání kódu.',
    number_confirmed: '✅ Číslo potvrzeno',
    code_expired: '⏱️ Kód vypršel. Požádejte prosím o nový.',
    incorrect_code: '❌ Nesprávný kód. Zkuste to znovu.',
    verification_failed: '⚠️ Ověření selhalo. Zkuste to znovu.',
    flight_number_required: 'Je vyžadováno číslo letu.',
    trip_time_min_one_hour:
      'Zvolte prosím čas minimálně 1 hodinu od současnosti.',
  },
  de: {
    invalid_phone_number:
      'Geben Sie eine gültige Nummer mit Ländervorwahl ein. Beispiel: +420773633433',
    form_complete: 'Bitte füllen Sie alle Felder im Formular aus.',
    invalid_email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein!',
    select_fromAdress: 'Bitte wählen Sie eine Abholadresse',
    select_toAdress: 'Bitte wählen Sie eine Abgabeadresse',
    confirm_payment: 'Bitte bestätigen Sie Ihre Zahlungsmethode!',
    form_sent: 'Das Formular wurde erfolgreich gesendet ✅',
    email_error: 'Beim Senden der E-Mail ist ein Fehler aufgetreten!',
    select_car: 'Bitte wählen Sie einen Autotyp',
    pdf_upload_failed:
      'PDF konnte nicht auf den Server hochgeladen werden. Prüfen Sie die Konsole.',
    choose_pickup_A:
      '👉 Klicken Sie auf die Karte, um den Abholpunkt auszuwählen (Marker A).',
    choose_pickup_B:
      '👉 Klicken Sie auf die Karte, um den Abholpunkt auszuwählen (Marker B).',
    geolocation_failed: '⚠️ Ihr Standort konnte nicht ermittelt werden.',
    geolocation_not_supported:
      '⚠️ Ihr Browser unterstützt keine Geolokalisierung.',
    code_sent: '📩 Code gesendet!',
    send_again: '🔁 Erneut senden',
    code_send_error: '⚠️ Beim Senden des Codes ist ein Fehler aufgetreten.',
    number_confirmed: '✅ Nummer bestätigt',
    code_expired: '⏱️ Der Code ist abgelaufen. Bitte fordere einen neuen an.',
    incorrect_code: '❌ Falscher Code. Bitte versuche es erneut.',
    verification_failed:
      '⚠️ Verifizierung fehlgeschlagen. Bitte versuche es erneut.',
    flight_number_required: 'Flugnummer erforderlich.',
    trip_time_min_one_hour:
      'Bitte wählen Sie eine Uhrzeit mindestens 1 Stunde ab jetzt.',
  },
  fr: {
    invalid_phone_number:
      'Entrez un numéro valide avec l’indicatif du pays. Exemple : +420773633433',
    form_complete: 'Veuillez remplir tous les champs du formulaire.',
    invalid_email: 'Veuillez saisir une adresse email valide !',
    select_fromAdress: "Veuillez sélectionner l'adresse de prise en charge",
    select_toAdress: "Veuillez sélectionner l'adresse de dépôt",
    confirm_payment: 'Veuillez confirmer votre méthode de paiement !',
    form_sent: 'Le formulaire a été soumis avec succès ✅',
    email_error: "Une erreur s'est produite lors de l'envoi de l'email !",
    select_car: 'Veuillez sélectionner un type de voiture',
    pdf_upload_failed:
      'Impossible de télécharger le PDF sur le serveur. Vérifiez la console.',
    choose_pickup_A:
      '👉 Cliquez sur la carte pour choisir le point de prise en charge (Marker A).',
    choose_pickup_B:
      '👉 Cliquez sur la carte pour choisir le point de prise en charge (Marker B).',
    geolocation_failed: "⚠️ Impossible d'obtenir votre position.",
    geolocation_not_supported:
      '⚠️ Votre navigateur ne supporte pas la géolocalisation.',
    code_sent: '📩 Code envoyé !',
    send_again: '🔁 Envoyer à nouveau',
    code_send_error: "⚠️ Une erreur s'est produite lors de l'envoi du code.",
    number_confirmed: '✅ Numéro confirmé',
    code_expired: '⏱️ Le code a expiré. Veuillez en demander un nouveau.',
    incorrect_code: '❌ Code incorrect. Veuillez réessayer.',
    verification_failed: '⚠️ Échec de la vérification. Veuillez réessayer.',
    flight_number_required: 'Le numéro de vol est requis.',
    trip_time_min_one_hour:
      'Choisissez une heure au moins 1 heure après maintenant.',
  },
  es: {
    invalid_phone_number:
      'Introduce un número válido con el código de país. Ejemplo: +420773633433',
    form_complete: 'Por favor completa todos los campos del formulario.',
    invalid_email: '¡Por favor ingresa una dirección de correo válida!',
    select_fromAdress: 'Por favor selecciona una dirección de recogida',
    select_toAdress: 'Por favor selecciona una dirección de destino',
    confirm_payment: '¡Por favor confirma tu método de pago!',
    form_sent: 'El formulario se ha enviado correctamente ✅',
    email_error: '¡Hubo un error al enviar el correo!',
    select_car: 'Por favor selecciona un tipo de coche',
    pdf_upload_failed:
      'No se pudo subir el PDF al servidor. Revisa la consola.',
    choose_pickup_A:
      '👉 Haz clic en el mapa para elegir el punto de recogida (Marker A).',
    choose_pickup_B:
      '👉 Haz clic en el mapa para elegir el punto de recogida (Marker B).',
    geolocation_failed: '⚠️ No se pudo obtener tu ubicación.',
    geolocation_not_supported: '⚠️ Tu navegador no soporta la geolocalización.',
    code_sent: '📩 Código enviado!',
    send_again: '🔁 Enviar de nuevo',
    code_send_error: '⚠️ Ocurrió un error al enviar el código.',
    number_confirmed: '✅ Número confirmado',
    code_expired: '⏱️ El código ha caducado. Solicita uno nuevo.',
    incorrect_code: '❌ Código incorrecto. Inténtalo de nuevo.',
    verification_failed: '⚠️ La verificación falló. Inténtalo de nuevo.',
    flight_number_required: 'Se requiere el número de vuelo.',
    trip_time_min_one_hour:
      'Elija una hora al menos 1 hora a partir de ahora.',
  },
  zh: {
    invalid_phone_number: '请输入带有国家代码的有效号码。例如：+420773633433',
    form_complete: '请填写表单中的所有字段。',
    invalid_email: '请输入有效的电子邮件地址！',
    select_fromAdress: '请选择取件地址',
    select_toAdress: '请选择送达地址',
    confirm_payment: '请确认您的付款方式！',
    form_sent: '表单已成功提交 ✅',
    email_error: '发送电子邮件时出错！',
    select_car: '请选择车辆类型',
    pdf_upload_failed: '无法将 PDF 上传到服务器。请检查控制台。',
    choose_pickup_A: '👉 点击地图以选择上车点（标记 A）。',
    choose_pickup_B: '👉 点击地图以选择上车点（标记 B）。',
    geolocation_failed: '⚠️ 无法获取您的位置。',
    geolocation_not_supported: '⚠️ 您的浏览器不支持地理位置功能。',
    code_sent: '📩 代码已发送！',
    send_again: '🔁 再次发送',
    code_send_error: '⚠️ 发送代码时发生错误。',
    number_confirmed: '✅ 号码已确认',
    code_expired: '⏱️ 代码已过期。请请求新的代码。',
    incorrect_code: '❌ 代码不正确。请重试。',
    verification_failed: '⚠️ 验证失败。请重试。',
    flight_number_required: '需要填写航班号。',
    trip_time_min_one_hour: '请选择比当前时间晚至少 1 小时的时间。',
  },
  ru: {
    invalid_phone_number:
      'Введите правильный номер с кодом страны. Пример: +420773633433',
    form_complete: 'Пожалуйста, заполните все поля формы.',
    invalid_email: 'Пожалуйста, введите корректный адрес электронной почты!',
    select_fromAdress: 'Пожалуйста, выберите адрес посадки',
    select_toAdress: 'Пожалуйста, выберите адрес высадки',
    confirm_payment: 'Пожалуйста, подтвердите способ оплаты!',
    form_sent: 'Форма успешно отправлена ✅',
    email_error: 'Произошла ошибка при отправке письма!',
    select_car: 'Пожалуйста, выберите тип автомобиля',
    pdf_upload_failed: 'Не удалось загрузить PDF на сервер. Проверьте консоль.',
    choose_pickup_A:
      '👉 Нажмите на карту, чтобы выбрать точку посадки (Маркер A).',
    choose_pickup_B:
      '👉 Нажмите на карту, чтобы выбрать точку посадки (Маркер B).',
    geolocation_failed: '⚠️ Не удалось получить ваше местоположение.',
    geolocation_not_supported: '⚠️ Ваш браузер не поддерживает геолокацию.',
    code_sent: '📩 Код отправлен!',
    send_again: '🔁 Отправить снова',
    code_send_error: '⚠️ Произошла ошибка при отправке кода.',
    number_confirmed: '✅ Номер подтверждён',
    code_expired: '⏱️ Код истёк. Пожалуйста, запросите новый.',
    incorrect_code: '❌ Неправильный код. Пожалуйста, попробуйте снова.',
    verification_failed:
      '⚠️ Верификация не удалась. Пожалуйста, попробуйте снова.',
    flight_number_required: 'Требуется номер рейса.',
    trip_time_min_one_hour:
      'Пожалуйста, выберите время минимум через 1 час от текущего.',
  },
};
