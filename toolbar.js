const toolbarHTML = `
    <div class="toolbar">
        <button onclick="window.location.href='index.html'"><i class="fas fa-home"></i> Home</button>
        <button onclick="window.location.href='Art Spirographia.html'"><i class="fas fa-draw-polygon"></i> Art</button>
        <button onclick="window.location.href='AudioCritic.html'"><i class="fas fa-robot"></i> AI Critic</button>
        <button onclick="window.location.href='berlin.html'"><i class="fas fa-drum-steelpan"></i> Berlin</button>
        <button onclick="window.location.href='Centipoids.html'"><i class="fas fa-gamepad"></i> Centipoids</button>
        <button onclick="window.location.href='chords.html'"><i class="fas fa-guitar"></i> Chords</button>
        <button onclick="window.location.href='CosmicDrift.html'"><i class="fas fa-galaxy"></i> Cosmic</button>
        <button onclick="window.location.href='DarkHolidays.html'"><i class="fas fa-tree"></i> Holidays</button>
        <button onclick="window.location.href='delay.html'"><i class="fas fa-clock"></i> Delay</button>
        <button onclick="window.location.href='karplus.html'"><i class="fas fa-wave-square"></i> Karplus</button>
        <button onclick="window.location.href='LollipopLand.html'"><i class="fas fa-candy-cane"></i> Lollipop</button>
        <button onclick="window.location.href='MandelPlanet.html'"><i class="fas fa-atom"></i> Mandel</button>
        <button onclick="window.location.href='OceanTravels.html'"><i class="fas fa-water"></i> Ocean</button>
        <button onclick="window.location.href='Phrenophobia.html'"><i class="fas fa-biohazard"></i> Phreno</button>
        <button onclick="window.location.href='play_midi.html'"><i class="fas fa-play"></i> MIDI</button>
        <button onclick="window.location.href='polychain.html'"><i class="fas fa-link"></i> Chain</button>
        <button onclick="window.location.href='rhythm.html'"><i class="fas fa-drum"></i> Rhythm</button>
        <button onclick="window.location.href='Shepard chord.html'"><i class="fas fa-music"></i> Shepard</button>
        <button onclick="window.location.href='SpaceTravel.html'"><i class="fas fa-rocket"></i> Space</button>
        <button onclick="window.location.href='SpectralSquadron.html'"><i class="fas fa-fighter-jet"></i> Squadron</button>
        <button onclick="window.location.href='Spirals.html'"><i class="fas fa-circle-notch"></i> Spirals</button>
        <button onclick="window.location.href='starfield.html'"><i class="fas fa-stars"></i> Stars</button>
        <button onclick="window.location.href='Steampunk Defense.html'"><i class="fas fa-cog"></i> Defense</button>
    </div>
`;

const toolbarCSS = `<style id="toolbar-styles">
    /* Toolbar styles */
    .toolbar {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background: #333;
        padding: 2px;
        box-sizing: border-box;
        text-align: center;
        z-index: 1000;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 2px;
        font-family: 'Inter', sans-serif;
    }
    .toolbar button {
        background: #555;
        color: white;
        border: 1px solid #888;
        border-radius: 3px;
        padding: 1px 4px;
        margin: 1px;
        cursor: pointer;
        font-size: 12px;
        min-width: 70px;
        flex: 0 1 auto;
    }
    .toolbar button:hover {
        background: #666;
    }
    .toolbar button:disabled {
        background: #777;
        color: #ccc;
        cursor: default;
    }
</style>
`;

document.addEventListener('DOMContentLoaded', () => {
    // Only inject if not already present
    if (!document.getElementById('toolbar-styles')) {
        document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">');
        document.head.insertAdjacentHTML('beforeend', toolbarCSS);
        document.body.insertAdjacentHTML('afterbegin', toolbarHTML);
    }
    
    // Disable the button for the current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const buttons = document.querySelectorAll('.toolbar button');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(currentPage)) {
            btn.disabled = true;
            btn.removeAttribute('onclick');
        }
    });
});
