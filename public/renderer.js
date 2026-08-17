document.querySelectorAll('.tile').forEach((tile) => {
  tile.addEventListener('click', () => {
    window.suite.open(tile.dataset.target)
  })
})

const wsStatus = document.getElementById('ws-status')

async function refreshWsStatus() {
  const up = await window.suite.checkMejoraWs()
  wsStatus.dataset.state = up ? 'up' : 'down'
  wsStatus.textContent = up ? 'Conectado' : 'No detectado'
}

refreshWsStatus()
setInterval(refreshWsStatus, 15000)
