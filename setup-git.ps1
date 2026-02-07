# Script para configurar Git y hacer el primer commit
Write-Host "🚀 Configurando Git para HR Co-pilot..." -ForegroundColor Cyan

# Configurar Git (si no está configurado)
Write-Host "`n📝 Configurando usuario de Git..." -ForegroundColor Yellow
git config --global user.name "Sofia Briso"
git config --global user.email "sofiabriso@metricool.com"

# Inicializar repositorio
Write-Host "`n📦 Inicializando repositorio Git..." -ForegroundColor Yellow
git init

# Añadir todos los archivos
Write-Host "`n➕ Añadiendo archivos al repositorio..." -ForegroundColor Yellow
git add .

# Crear primer commit
Write-Host "`n💾 Creando primer commit..." -ForegroundColor Yellow
git commit -m "Initial commit - HR Co-pilot application"

Write-Host "`n✅ ¡Git configurado correctamente!" -ForegroundColor Green
Write-Host "`n📋 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "1. Ve a https://github.com/new" -ForegroundColor White
Write-Host "2. Nombre del repositorio: hr-copilot" -ForegroundColor White
Write-Host "3. Descripción: HR Management Co-pilot Application" -ForegroundColor White
Write-Host "4. Déjalo como PÚBLICO" -ForegroundColor White
Write-Host "5. NO marques 'Add a README file'" -ForegroundColor White
Write-Host "6. Click en 'Create repository'" -ForegroundColor White
Write-Host "`n7. Después, ejecuta estos comandos:" -ForegroundColor Cyan
Write-Host "   git remote add origin https://github.com/TU-USUARIO/hr-copilot.git" -ForegroundColor Yellow
Write-Host "   git branch -M main" -ForegroundColor Yellow
Write-Host "   git push -u origin main" -ForegroundColor Yellow
Write-Host "`n⚠️  Reemplaza 'TU-USUARIO' con tu nombre de usuario de GitHub" -ForegroundColor Red
