class ProjectileMotionSimulator {
    constructor() {
        this.canvas = document.getElementById('simulation-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Physics constants
        this.gravity = 7; // m/s²
        
        // Simulation state
        this.isRunning = false;
        this.animationId = null;
        this.startTime = 0;
        
        // Current parameters (match slider defaults)
        this.initialVelocity = 2.5; // m/s
        this.mass = 1; // kg (note: mass doesn't affect motion in vacuum)
        this.initialHeight = 2.5; // m
        
        // Current state
        this.currentTime = 0;
        this.currentHeight = 0;
        this.currentVelocity = 0;
        this.maxHeight = 0;
        this.flightTime = 0;
        
        // Visual scaling
        this.pixelsPerMeter = 20; // pixels per meter (adjusted for 30m display)
        this.maxDisplayHeight = 30; // maximum height to display in meters
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
        this.generateHeightTicks();

        // If ended at podium, ensure resting position visually matches podium top
        if (!this.isRunning) {
            this.positionBall(this.initialHeight, false);
        }
        this.generateHeightTicks();
    }
    
    initializeElements() {
        // Sliders
        this.velocitySlider = document.getElementById('initial-velocity');
        this.massSlider = document.getElementById('mass');
        this.heightSlider = document.getElementById('initial-height');
        
        // Value displays
        this.velocityValue = document.getElementById('velocity-value');
        this.massValue = document.getElementById('mass-value');
        this.heightValue = document.getElementById('height-value');
        
        // Buttons
        this.startBtn = document.getElementById('start-simulation');
        this.resetBtn = document.getElementById('reset-simulation');
        
        // Info displays
        this.timeDisplay = document.getElementById('current-time');
        this.heightDisplay = document.getElementById('current-height');
        this.velocityDisplay = document.getElementById('current-velocity');
        
        // Simulation area
        this.simulationArea = document.querySelector('.simulation-area');
    }
    
    bindEvents() {
        // Slider events
        this.velocitySlider.addEventListener('input', (e) => {
            this.initialVelocity = parseFloat(e.target.value);
            this.velocityValue.textContent = this.initialVelocity.toFixed(1);
            this.calculateMaxHeight();
            this.updateDisplay();
        });
        
        this.massSlider.addEventListener('input', (e) => {
            this.mass = parseFloat(e.target.value);
            this.massValue.textContent = this.mass.toFixed(1);
        });
        
        this.heightSlider.addEventListener('input', (e) => {
            this.initialHeight = parseFloat(e.target.value);
            this.heightValue.textContent = this.initialHeight.toFixed(1);
            this.calculateMaxHeight();
            this.updateDisplay();
            this.updatePodium();
            
            // Update ball position if it exists and simulation is not running
            if (!this.isRunning) {
                this.currentHeight = this.initialHeight;
                if (this.ball) {
                    this.positionBallOnPodium(this.initialHeight);
                } else {
                    this.createBall();
                }
            }
        });
        
        // Button events
        this.startBtn.addEventListener('click', () => this.startSimulation());
        this.resetBtn.addEventListener('click', () => this.resetSimulation());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.isRunning) {
                this.startSimulation();
            }
        });
        
        // Initialize podium and ball
        this.createPodium();
        this.updatePodium();
        this.createBall();
        this.currentHeight = this.initialHeight;
    }
    
    calculateMaxHeight() {
        // With variable gravity g(h) = 7/(h + 5), we need to simulate to find max height
        // Simulate until velocity becomes zero (peak height)
        
        let time = 0;
        let maxHeight = this.initialHeight;
        let lastVelocity = this.initialVelocity;
        
        // Simulate with small time steps to find when velocity becomes zero
        const dt = 0.01; // 10ms steps for faster calculation
        for (let t = 0; t < 100; t += dt) { // Max 100 seconds
            const position = this.calculatePosition(t);
            
            if (position.velocity <= 0 && t > 0) {
                // Found peak - velocity just became negative
                maxHeight = Math.max(maxHeight, position.height);
                break;
            }
            
            maxHeight = Math.max(maxHeight, position.height);
            lastVelocity = position.velocity;
        }
        
        this.maxHeight = maxHeight;
        
        // Estimate flight time by simulating until ball returns to start height
        this.flightTime = 0;
        for (let t = 0; t < 200; t += 0.1) { // Max 200 seconds
            const position = this.calculatePosition(t);
            if (t > 0.1 && position.height <= this.initialHeight + 0.01) {
                this.flightTime = t;
                break;
            }
        }
        
        if (this.flightTime === 0) {
            this.flightTime = 100; // Fallback
        }
    }
    
    generateHeightTicks() {
        const leftScale = document.querySelector('.left-scale');
        const rightScale = document.querySelector('.right-scale');
        
        if (!leftScale || !rightScale) {
            console.error('Height scale elements not found!');
            return;
        }
        
        // Clear existing ticks
        leftScale.innerHTML = '';
        rightScale.innerHTML = '';
        
        // Generate ticks every 1 meter (from 0 at ground up to maxDisplayHeight)
        for (let height = 0; height <= this.maxDisplayHeight; height += 1) {
            const leftTick = this.createHeightTick(height, 'left');
            const rightTick = this.createHeightTick(height, 'right');
            
            leftScale.appendChild(leftTick);
            rightScale.appendChild(rightTick);
        }
    }
    
    createHeightTick(height, side) {
        const tick = document.createElement('div');
        tick.className = 'height-tick';
        
        const label = document.createElement('span');
        label.className = 'height-label';
        label.textContent = `${height}m`;
        
        tick.appendChild(label);
        
        // Position the tick based on height relative to the full simulation area
        // Use the simulation area's clientHeight (canvas + ground) so 0m aligns with ground top
        const containerHeight = this.simulationArea.clientHeight;
        const groundHeight = 40;
        const tickPosition = containerHeight - groundHeight - (height * this.pixelsPerMeter);
        tick.style.position = 'absolute';
        tick.style.top = `${tickPosition}px`;
        tick.style.width = '100%';
        
        return tick;
    }
    
    createPodium() {
        this.podium = document.createElement('div');
        this.podium.className = 'podium';
        this.simulationArea.appendChild(this.podium);
    }
    
    updatePodium() {
        if (this.podium) {
            const podiumHeight = this.initialHeight * this.pixelsPerMeter;
            this.podium.style.height = `${podiumHeight}px`;
        }
    }
    
    createBall() {
        // Remove existing ball if any
        const existingBall = document.querySelector('.ball');
        if (existingBall) {
            existingBall.remove();
        }
        
        this.ball = document.createElement('div');
        this.ball.className = 'ball';
        this.simulationArea.appendChild(this.ball);
        
        // Position ball at starting position
        this.positionBallOnPodium(this.initialHeight);
    }
    
    positionBallByBottomHeight(height) {
        if (!this.ball) return;
        const containerHeight = this.simulationArea.clientHeight;
        const groundHeight = 40;
        const ballSize = 20;
        const areaWidth = this.simulationArea.clientWidth;
        const ballX = (areaWidth / 2) - (ballSize / 2);
        const ballY = (containerHeight - groundHeight) - (height * this.pixelsPerMeter) - ballSize;
        this.ball.style.left = `${ballX}px`;
        this.ball.style.top = `${ballY}px`;
    }

    positionBallOnPodium(height) {
        if (!this.ball) return;
        const containerHeight = this.simulationArea.clientHeight;
        const groundHeight = 40;
        const ballSize = 20;
        const areaWidth = this.simulationArea.clientWidth;
        let podiumTopY;
        if (this.podium && this.simulationArea) {
            const containerRect = this.simulationArea.getBoundingClientRect();
            const podiumRect = this.podium.getBoundingClientRect();
            podiumTopY = podiumRect.top - containerRect.top;
        } else {
            const podiumHeight = height * this.pixelsPerMeter;
            podiumTopY = (containerHeight - groundHeight) - podiumHeight;
        }
        const ballX = (areaWidth / 2) - (ballSize / 2);
        const ballY = podiumTopY - ballSize;
        this.ball.style.left = `${ballX}px`;
        this.ball.style.top = `${ballY}px`;
    }
    
    calculatePosition(time) {
        // Variable gravity physics: g(h) = 7/(h + 5)
        // This requires numerical integration since acceleration depends on position
        
        if (time === 0) {
            return {
                height: this.initialHeight,
                velocity: this.initialVelocity
            };
        }
        
        // Use small time steps for numerical integration
        const dt = 0.001; // 1ms time step
        let currentHeight = this.initialHeight;
        let currentVelocity = this.initialVelocity;
        
        for (let t = 0; t < time; t += dt) {
            // Calculate gravity at current height: g(h) = 7/(h + 5)
            const currentGravity = 7 / (currentHeight + 5);
            
            // Update velocity: v = v - g*dt
            currentVelocity -= currentGravity * dt;
            
            // Update position: h = h + v*dt
            currentHeight += currentVelocity * dt;
            
            // Don't go below ground
            if (currentHeight <= 0) {
                currentHeight = 0;
                currentVelocity = 0;
                break;
            }
        }
        
        return {
            height: Math.max(0, currentHeight),
            velocity: currentVelocity
        };
    }
    
    startSimulation() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startTime = performance.now();
        this.currentTime = 0;
        
        this.calculateMaxHeight();
        this.createBall();
        
        this.startBtn.textContent = 'Run';
        this.startBtn.disabled = true;
        
        this.animate();
    }
    
    animate() {
        if (!this.isRunning) return;
        
        const now = performance.now();
        this.currentTime = (now - this.startTime) / 1000; // Convert to seconds
        
        const position = this.calculatePosition(this.currentTime);
        this.currentHeight = position.height;
        this.currentVelocity = position.velocity;
        
        // Update ball position (using physics height during simulation)
        this.positionBallByBottomHeight(this.currentHeight);
        
        // Update displays
        this.updateDisplay();
        
        // Check if simulation should end when the ball returns to podium height
        // End if time exceeded computed flight time or if height fell to/below initialHeight (with small tolerance)
        const epsilon = 0.01; // meters tolerance
        const timeEpsilon = 0.001; // seconds
        const returnedToStartHeight = (this.currentTime > timeEpsilon) && (this.currentHeight <= this.initialHeight + epsilon) && (this.currentVelocity <= 0);
        if (this.currentTime >= this.flightTime || returnedToStartHeight) {
            // Snap to podium height to avoid sinking
            this.currentHeight = this.initialHeight;
            this.positionBallByBottomHeight(this.currentHeight);
            this.endSimulation();
            return;
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    endSimulation() {
        this.isRunning = false;
        this.startBtn.textContent = 'Run';
        this.startBtn.disabled = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Position ball at ground level (resting position)
        this.positionBallOnPodium(0);
        this.currentHeight = 0;
        this.currentVelocity = 0;
        this.updateDisplay();
    }
    
    resetSimulation() {
        this.endSimulation();
        
        // Reset time and position
        this.currentTime = 0;
        this.currentHeight = this.initialHeight;
        this.currentVelocity = 0;
        
        // Reset ball position to current initial height (resting position)
        if (this.ball) {
            this.positionBallOnPodium(this.initialHeight);
        } else {
            this.createBall();
        }
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        // Update current values display
        this.timeDisplay.textContent = `${this.currentTime.toFixed(2)} s`;
        this.heightDisplay.textContent = `${this.currentHeight.toFixed(2)} m`;
        this.velocityDisplay.textContent = `${this.currentVelocity.toFixed(2)} m/s`;
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight - 40; // Leave space for ground
        
        // Regenerate height ticks with new canvas dimensions
        this.generateHeightTicks();
        this.updatePodium();
        
        if (this.ball) {
            const usePhysics = this.isRunning;
            if (usePhysics) {
                this.positionBallByBottomHeight(this.currentHeight || this.initialHeight);
            } else {
                this.positionBallOnPodium(this.currentHeight || this.initialHeight);
            }
        }
    }
}

// Initialize the simulator when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const simulator = new ProjectileMotionSimulator();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        simulator.resizeCanvas();
    });
    
    // Initial canvas resize
    setTimeout(() => {
        simulator.resizeCanvas();
    }, 100);
});
