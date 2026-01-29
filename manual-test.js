const { chromium, devices } = require('./packages/playwright-core');

(async () => {
  console.log('🚀 Starting touchscreen tapAndDrag test...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50 // Slow down so you can see what's happening
  });
  
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    viewport: { width: 390, height: 844 }
  });
  
  const page = await context.newPage();
  
  // Create a simple drag test page
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial; }
        #draggable {
          width: 100px;
          height: 100px;
          background: #4CAF50;
          border-radius: 10px;
          position: absolute;
          left: 50px;
          top: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          user-select: none;
        }
        #target {
          width: 200px;
          height: 200px;
          background: #2196F3;
          border-radius: 10px;
          position: absolute;
          right: 50px;
          top: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
        }
        #log {
          position: absolute;
          top: 10px;
          left: 10px;
          background: #f0f0f0;
          padding: 10px;
          border-radius: 5px;
          font-size: 12px;
          max-width: 300px;
        }
      </style>
    </head>
    <body>
      <div id="log">Touch events will appear here...</div>
      <div id="draggable">Drag Me!</div>
      <div id="target">Drop Zone</div>
      
      <script>
        const log = document.getElementById('log');
        const draggable = document.getElementById('draggable');
        let events = [];
        
        function logEvent(msg) {
          events.push(msg);
          log.innerHTML = events.join('<br>');
        }
        
        draggable.addEventListener('touchstart', (e) => {
          logEvent('✓ touchstart at ' + Math.round(e.touches[0].clientX) + ',' + Math.round(e.touches[0].clientY));
        });
        
        draggable.addEventListener('touchmove', (e) => {
          e.preventDefault();
          const touch = e.touches[0];
          logEvent('→ touchmove at ' + Math.round(touch.clientX) + ',' + Math.round(touch.clientY));
          draggable.style.left = (touch.clientX - 50) + 'px';
          draggable.style.top = (touch.clientY - 50) + 'px';
        });
        
        draggable.addEventListener('touchend', (e) => {
          logEvent('✓ touchend');
          
          // Check if dropped in target
          const dragRect = draggable.getBoundingClientRect();
          const targetRect = document.getElementById('target').getBoundingClientRect();
          
          if (dragRect.left < targetRect.right && 
              dragRect.right > targetRect.left &&
              dragRect.top < targetRect.bottom && 
              dragRect.bottom > targetRect.top) {
            logEvent('🎉 SUCCESS! Dropped in target zone!');
            document.getElementById('target').style.background = '#4CAF50';
          }
        });
      </script>
    </body>
    </html>
  `);
  
  await page.waitForTimeout(1000);
  
  console.log('✨ Testing tapAndDrag method...');
  const draggableBox = await page.locator('#draggable').boundingBox();
  const targetBox = await page.locator('#target').boundingBox();
  
  if (draggableBox && targetBox) {
    const startX = draggableBox.x + draggableBox.width / 2;
    const startY = draggableBox.y + draggableBox.height / 2;
    const endX = targetBox.x + targetBox.width / 2;
    const endY = targetBox.y + targetBox.height / 2;
    
    console.log(`   From: (${Math.round(startX)}, ${Math.round(startY)})`);
    console.log(`   To:   (${Math.round(endX)}, ${Math.round(endY)})`);
    
    try {
      await page.touchscreen.tapAndDrag(startX, startY, endX, endY, { steps: 150 });
      console.log('✅ tapAndDrag completed successfully!\n');
    } catch (error) {
      console.error('❌ tapAndDrag failed:', error.message, '\n');
    }
  }
  
  await page.waitForTimeout(2000);
  
  console.log('🧪 Testing individual touch methods (down → move → move → up)...');
  
  try {
    await page.touchscreen.down(100, 100);
    console.log('   ✓ down(100, 100)');
    
    await page.touchscreen.move(150, 150);
    console.log('   ✓ move(150, 150)');
    
    await page.touchscreen.move(200, 200);
    console.log('   ✓ move(200, 200)');
    
    await page.touchscreen.up(200, 200);
    console.log('   ✓ up(200, 200)');
    
    console.log('✅ Individual methods work!\n');
  } catch (error) {
    console.error('❌ Individual methods failed:', error.message, '\n');
  }
  
  console.log('🎬 Test complete! Browser will close in 5 seconds...');
  await page.waitForTimeout(5000);
  
  await browser.close();
  console.log('👋 Done!');
})().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
