# Colors for messages
$Green = [System.ConsoleColor]::Green
$Red = [System.ConsoleColor]::Red

Write-Host "Setting up Breezy environment..." -ForegroundColor $Green

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "Docker is installed: $dockerVersion" -ForegroundColor $Green
} catch {
    Write-Host "Docker is not installed. Please install it first." -ForegroundColor $Red
    exit 1
}

# Check if Docker Compose is installed
try {
    $composeVersion = docker-compose --version
    Write-Host "Docker Compose is installed: $composeVersion" -ForegroundColor $Green
} catch {
    Write-Host "Docker Compose is not installed. Please install it first." -ForegroundColor $Red
    exit 1
}

# Build and start containers
Write-Host "Building and starting containers..." -ForegroundColor $Green
docker-compose up --build -d

Write-Host "Setup completed!" -ForegroundColor $Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor $Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor $Green 