function goHadd() {
    const centerSpan = document.getElementById("center-span");
    if(centerSpan){
    fetch("/hadd")
      .then((response) => { return response.json();})
      .then((data)=> {centerSpan.innerHTML = data.val;})
      .catch((error) => {centerSpan.innerHTML = `Error: ${error.message}`;});
    }
  }