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
        this.initialHeight = 0; // m - always start from ground
        this.launchAngle = 25; // degrees - within allowed range
        
        // Current state
        this.currentTime = 0;
        this.currentHeight = 0;
        this.currentX = 0;
        this.currentVelocityX = 0;
        this.currentVelocityY = 0;
        this.maxHeight = 0;
        this.flightTime = 0;
        
        // Visual scaling
        this.maxDisplayHeight = 15; // maximum height to display in meters
        this.pixelsPerMeter = 10; // will be calculated dynamically based on container height
        
        // Starting position offset from left edge
        this.startXOffset = 1; // meters from left edge
        
        // Horizontal display range
        this.horizontalDisplayRange = 25; // meters to show across full width
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
        
        // Initialize angle display
        if (this.angleValue) {
            this.angleValue.textContent = this.launchAngle.toFixed(0) + '°';
        }

        // Delay initial setup to ensure DOM is fully rendered
        setTimeout(() => {
            this.calculatePixelsPerMeter();
            this.generateHeightTicks();
            this.generateXAxisTicks();
            
            if (!this.isRunning) {
                this.createBall();
            }
        }, 50);
    }
    
    initializeElements() {
        // Sliders
        this.velocitySlider = document.getElementById('initial-velocity');
        this.massSlider = document.getElementById('mass');
        this.angleSlider = document.getElementById('launch-angle');
        
        // Value displays
        this.velocityValue = document.getElementById('velocity-value');
        this.massValue = document.getElementById('mass-value');
        this.angleValue = document.getElementById('angle-value');
        
        // Buttons
        this.startBtn = document.getElementById('start-simulation');
        this.resetBtn = document.getElementById('reset-simulation');
        
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
            this.generateXAxisTicks();
        });
        
        this.massSlider.addEventListener('input', (e) => {
            this.mass = parseFloat(e.target.value);
            this.massValue.textContent = this.mass.toFixed(1);
        });
        
        this.angleSlider.addEventListener('input', (e) => {
            let requestedAngle = parseFloat(e.target.value);
            
            // Restrict to allowed ranges: 0-25° and 65-75°
            if (requestedAngle > 25 && requestedAngle < 65) {
                // Snap to closest allowed value for forbidden middle range
                if (requestedAngle <= 45) {
                    requestedAngle = 25; // Snap to upper bound of first range
                } else {
                    requestedAngle = 65; // Snap to lower bound of second range
                }
                // Update the slider position to reflect the snapped value
                e.target.value = requestedAngle;
            } else if (requestedAngle > 75) {
                // Cap at maximum allowed angle
                requestedAngle = 75;
                e.target.value = requestedAngle;
            }
            
            this.launchAngle = requestedAngle;
            this.angleValue.textContent = this.launchAngle.toFixed(0) + '°';
            this.calculateMaxHeight();
            this.updateDisplay();
            this.generateXAxisTicks();
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
        
        // Initialize ball at ground level
        this.createBall();
        this.currentHeight = this.initialHeight;
        this.generateXAxisTicks();
    }
    
    calculateMaxHeight() {
        // Convert angle to radians
        const angleRad = (this.launchAngle * Math.PI) / 180;
        
        // Calculate vertical velocity component
        const v0y = this.initialVelocity * Math.sin(angleRad);
        
        // Calculate maximum height using kinematic equation: h_max = h_0 + v_0y²/(2g)
        this.maxHeight = this.initialHeight + (v0y * v0y) / (2 * this.gravity);
        
        // Calculate time of flight - simplified for ground-level launches
        if (this.initialHeight === 0) {
            // For ground-level launches: t = 2*v_0y/g
            this.flightTime = Math.abs(v0y) > 0.001 ? (2 * Math.abs(v0y)) / this.gravity : 0.1;
        } else {
            // For elevated launches, use quadratic formula
            // h(t) = h_0 + v_0y*t - (1/2)*g*t² = 0
            const a = -0.5 * this.gravity;
            const b = v0y;
            const c = this.initialHeight;
            
            const discriminant = b * b - 4 * a * c;
            if (discriminant >= 0) {
                const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
                const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
                this.flightTime = Math.max(t1, t2);
            } else {
                this.flightTime = 0.1; // Minimum flight time
            }
        }
        
        // Ensure minimum flight time for very low velocities
        this.flightTime = Math.max(this.flightTime, 0.1);
    }
    
    calculatePixelsPerMeter() {
        // Calculate pixels per meter to fill the full display height
        const containerHeight = this.simulationArea.clientHeight;
        const groundHeight = 40;
        const availableHeight = containerHeight - groundHeight;
        
        // Ensure we have valid dimensions before calculating
        if (availableHeight > 0 && this.maxDisplayHeight > 0) {
            this.pixelsPerMeter = availableHeight / this.maxDisplayHeight;
        } else {
            // Fallback to default scaling if dimensions aren't ready
            this.pixelsPerMeter = 20; // 20 pixels per meter as fallback
        }
        
        // Ensure minimum scaling
        this.pixelsPerMeter = Math.max(this.pixelsPerMeter, 5);
    }

    generateHeightTicks() {
        const leftScale = document.querySelector('.left-scale');
        const rightScale = document.querySelector('.right-scale');
        
        if (!leftScale || !rightScale) {
            console.error('Height scale elements not found!');
            return;
        }
        
        // Calculate proper scaling first
        this.calculatePixelsPerMeter();
        
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
        
        // Only add label if it's not the maximum height (20m)
        if (height < this.maxDisplayHeight) {
            const label = document.createElement('span');
            label.className = 'height-label';
            label.textContent = `${height}m`;
            tick.appendChild(label);
        }
        
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
    
    generateXAxisTicks() {
        const xAxisScale = document.querySelector('.x-axis-scale');
        
        if (!xAxisScale) {
            console.error('X-axis scale element not found!');
            return;
        }
        
        // Clear existing ticks
        xAxisScale.innerHTML = '';
        
        // Calculate how many meters to show across the full width
        const areaWidth = this.simulationArea.clientWidth;
        
        // Generate ticks every 1 meter, starting from the launch position as 0m
        for (let distance = 0; distance <= this.horizontalDisplayRange; distance += 1) {
            const tick = this.createXTick(distance, areaWidth, this.horizontalDisplayRange);
            xAxisScale.appendChild(tick);
        }
    }
    
    createXTick(distance, areaWidth, desiredRange) {
        const tickContainer = document.createElement('div');
        
        const tick = document.createElement('div');
        tick.className = 'x-tick';
        
        // Only add label if it's not the maximum distance (25m)
        if (distance < this.horizontalDisplayRange) {
            const label = document.createElement('span');
            label.className = 'x-tick-label';
            // Adjust label so that the launch position (at startXOffset) shows as 0m
            const labelDistance = distance - this.startXOffset;
            if (labelDistance >= 0) {
                label.textContent = `${labelDistance}m`;
                tickContainer.appendChild(label);
            }
        }
        
        tickContainer.appendChild(tick);
        
        // Position the tick to span the full width evenly
        const tickPosition = (distance / desiredRange) * areaWidth;
        
        tickContainer.style.position = 'absolute';
        tickContainer.style.left = `${tickPosition}px`;
        
        return tickContainer;
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
        this.positionBallAtStart();
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
    
    positionBallInFlight(x, height) {
        if (!this.ball) return;
        const containerHeight = this.simulationArea.clientHeight;
        const groundHeight = 40;
        const ballSize = 20;
        const areaWidth = this.simulationArea.clientWidth;
        
        // Ensure we have valid dimensions
        if (containerHeight <= 0 || areaWidth <= 0) {
            console.warn('Invalid container dimensions during ball positioning');
            return;
        }
        
        // Convert physics coordinates to screen coordinates
        // Use horizontal display scaling for x position
        const horizontalPixelsPerMeter = areaWidth / this.horizontalDisplayRange;
        const ballX = (this.startXOffset + x) * horizontalPixelsPerMeter - (ballSize / 2);
        const ballY = (containerHeight - groundHeight) - (height * this.pixelsPerMeter) - ballSize;
        
        this.ball.style.left = `${ballX}px`;
        this.ball.style.top = `${ballY}px`;
    }

    positionBallAtStart() {
        if (!this.ball) return;
        const containerHeight = this.simulationArea.clientHeight;
        const groundHeight = 40;
        const ballSize = 20;
        const areaWidth = this.simulationArea.clientWidth;
        
        // Position ball at starting position on ground
        const horizontalPixelsPerMeter = areaWidth / this.horizontalDisplayRange;
        const ballX = this.startXOffset * horizontalPixelsPerMeter - (ballSize / 2);
        const ballY = (containerHeight - groundHeight) - ballSize;
        
        this.ball.style.left = `${ballX}px`;
        this.ball.style.top = `${ballY}px`;
    }
    
    calculatePosition(time) {
        // Convert angle to radians
        const angleRad = (this.launchAngle * Math.PI) / 180;
        
        // Calculate initial velocity components
        const v0x = this.initialVelocity * Math.cos(angleRad);
        const v0y = this.initialVelocity * Math.sin(angleRad);
        
        // Kinematic equations for projectile motion
        // x(t) = v_0x * t
        const x = v0x * time;
        
        // y(t) = h_0 + v_0y*t - (1/2)*g*t²
        const height = this.initialHeight + (v0y * time) - (0.5 * this.gravity * time * time);
        
        // Velocity components: vx(t) = v_0x (constant), vy(t) = v_0y - g*t
        const velocityX = v0x;
        const velocityY = v0y - (this.gravity * time);
        
        return {
            x: x,
            height: Math.max(0, height), // Don't go below ground
            velocityX: velocityX,
            velocityY: velocityY
        };
    }
    
    startSimulation() {
        if (this.isRunning) return;
        
        // Ensure proper scaling is calculated before starting
        this.calculatePixelsPerMeter();
        
        this.isRunning = true;
        this.startTime = performance.now();
        this.currentTime = 0;
        this.currentX = 0;
        
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
        this.currentX = position.x;
        this.currentVelocityX = position.velocityX;
        this.currentVelocityY = position.velocityY;
        
        // Update ball position (using physics position during simulation)
        this.positionBallInFlight(this.currentX, this.currentHeight);
        
        // Update displays
        this.updateDisplay();
        
        // Check if simulation should end when the ball hits the ground
        // End if time exceeded computed flight time or if height fell to/below ground (with small tolerance)
        const epsilon = 0.01; // meters tolerance
        const timeEpsilon = 0.001; // seconds
        const hitGround = (this.currentTime > timeEpsilon) && (this.currentHeight <= epsilon);
        if (this.currentTime >= this.flightTime || hitGround) {
            // Snap to ground level to avoid sinking
            this.currentHeight = 0;
            this.positionBallInFlight(this.currentX, this.currentHeight);
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
        this.positionBallInFlight(this.currentX, 0);
        this.currentHeight = 0;
        this.currentVelocityX = 0;
        this.currentVelocityY = 0;
        this.updateDisplay();
    }
    
    resetSimulation() {
        this.endSimulation();
        
        // Reset time and position
        this.currentTime = 0;
        this.currentHeight = this.initialHeight;
        this.currentX = 0;
        this.currentVelocityX = 0;
        this.currentVelocityY = 0;
        
        // Reset ball position to starting position
        if (this.ball) {
            this.positionBallAtStart();
        } else {
            this.createBall();
        }
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        // Display updates can be added here if needed
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight - 40; // Leave space for ground
        
        // Recalculate scaling for new dimensions and regenerate ticks
        this.calculatePixelsPerMeter();
        this.generateHeightTicks();
        this.generateXAxisTicks();
        
        if (this.ball) {
            const usePhysics = this.isRunning;
            if (usePhysics) {
                this.positionBallInFlight(this.currentX || 0, this.currentHeight || this.initialHeight);
            } else {
                this.positionBallAtStart();
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