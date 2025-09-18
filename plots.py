#%%
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns

# Create velocity vs time plot
# Time from 0 to 8 seconds
time = np.linspace(0, 8, 100)  # 100 points for smooth line
velocity = np.full_like(time, 4)  # Constant velocity of 4 m/s

# Create the plot with nice styling
plt.style.use('seaborn-v0_8-whitegrid')  # Use seaborn style for better aesthetics
plt.figure(figsize=(10, 6), facecolor='#f8f9fa')  # Light gray background

# Create the plot
ax = plt.gca()
ax.set_facecolor('#f8f9fa')  # Set plot area background

plt.plot(time, velocity, '#2E86AB', linewidth=3)  # Nice blue color, thicker line
plt.xlabel('Time (s)', fontsize=14, fontweight='bold', fontfamily='serif')
plt.ylabel('Velocity (m/s)', fontsize=14, fontweight='bold', fontfamily='serif')
plt.title('Velocity vs Time', fontsize=16, fontweight='bold', 
          fontfamily='serif', pad=20)

# Style the grid and ticks
plt.grid(True, alpha=0.4, linestyle='-', linewidth=0.5)
plt.tick_params(labelsize=12, colors='#333333')

# Set axis limits and styling
plt.xlim(0, 8)
plt.ylim(0, 5)

# Remove top and right spines for cleaner look
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_color('#cccccc')
ax.spines['bottom'].set_color('#cccccc')

plt.tight_layout()
plt.show()

#%%
# Piecewise velocity plot with 3 segments
# Define time segments
t1 = np.linspace(0, 3, 50)      # First segment: 0-3 seconds
t2 = np.linspace(3, 6, 50)      # Second segment: 3-6 seconds  
t3 = np.linspace(6, 10, 50)     # Third segment: 6-10 seconds

# Define velocity for each segment
v1 = 2 + 1.5 * t1              # Increasing: starts at 2, goes up
v2 = 6.5 - 0.8 * (t2 - 3)      # Decreasing: starts at 6.5, goes down
v3 = 4.1 + 0.6 * (t3 - 6)      # Increasing: starts at 4.1, goes up

# Combine all segments
time_total = np.concatenate([t1, t2, t3])
velocity_total = np.concatenate([v1, v2, v3])

# Create the plot with nice styling
plt.style.use('seaborn-v0_8-whitegrid')
plt.figure(figsize=(12, 7), facecolor='#f8f9fa')

ax = plt.gca()
ax.set_facecolor('#f8f9fa')

# Plot each segment with the same blue color
plt.plot(t1, v1, '#2E86AB', linewidth=3)
plt.plot(t2, v2, '#2E86AB', linewidth=3) 
plt.plot(t3, v3, '#2E86AB', linewidth=3)

# Add vertical lines to show segment boundaries
plt.axvline(x=3, color='#7F8C8D', linestyle='--', alpha=0.7, linewidth=2)
plt.axvline(x=6, color='#7F8C8D', linestyle='--', alpha=0.7, linewidth=2)

plt.xlabel('Time (s)', fontsize=14, fontweight='bold', fontfamily='serif')
plt.ylabel('Velocity (m/s)', fontsize=14, fontweight='bold', fontfamily='serif')
plt.title('Velocity vs Time', fontsize=16, fontweight='bold', 
          fontfamily='serif', pad=20)

# Style the grid and ticks
plt.grid(True, alpha=0.4, linestyle='-', linewidth=0.5)
plt.tick_params(labelsize=12, colors='#333333')

# Set axis limits
plt.xlim(0, 10)
plt.ylim(0, 9)

# Remove top and right spines
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_color('#cccccc')
ax.spines['bottom'].set_color('#cccccc')

plt.tight_layout()
plt.show()

#%%
# Sine wave velocity plot - full revolution from 0 to 8 seconds
# Time from 0 to 8 seconds
time = np.linspace(0, 8, 200)  # High resolution for smooth curve

# Sine function: full revolution (2π) scaled from 0 to 5
# sin(2π*t/8) gives full revolution over 8 seconds
# Multiply by 5 to scale amplitude from 0 to 5
velocity = 5 * np.sin(2 * np.pi * time / 8)

# Create the plot with nice styling
plt.style.use('seaborn-v0_8-whitegrid')
plt.figure(figsize=(10, 6), facecolor='#f8f9fa')

ax = plt.gca()
ax.set_facecolor('#f8f9fa')

plt.plot(time, velocity, '#2E86AB', linewidth=3)  # Same blue color

plt.xlabel('Time (s)', fontsize=14, fontweight='bold', fontfamily='serif')
plt.ylabel('Velocity (m/s)', fontsize=14, fontweight='bold', fontfamily='serif')
plt.title('Velocity vs Time', fontsize=16, fontweight='bold', 
          fontfamily='serif', pad=20)

# Style the grid and ticks
plt.grid(True, alpha=0.4, linestyle='-', linewidth=0.5)
plt.tick_params(labelsize=12, colors='#333333')

# Set axis limits
plt.xlim(0, 8)
plt.ylim(-5.5, 5.5)  # Full range to show negative and positive values

# Remove top and right spines
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_color('#cccccc')
ax.spines['bottom'].set_color('#cccccc')

plt.tight_layout()
plt.show()

#%%