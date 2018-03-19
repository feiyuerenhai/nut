var err = document.createElement('div');
err.className = 'nut-err';
err.innerHTML = '' +
'<div class="nut-err-title">ERROR</div>' +
'<div class="nut-err-content"><code>${err-content}</code></div>';
document.body.appendChild(err);