document.querySelectorAll(".dual-slider").forEach((group) => {
  const minInput = group.querySelector(".thumb--left");
  const maxInput = group.querySelector(".thumb--right");
  const rangeDiv = group.querySelector(".slider-range");
  const display = group.querySelector(".slider-value");
  const minGap = 0.1;
  const maxValue = parseFloat(minInput.max);
  const minValue = parseFloat(minInput.min);

  function updateRange() {
    let minVal = parseFloat(minInput.value);
    let maxVal = parseFloat(maxInput.value);

    if (maxVal - minVal < minGap) {
      if (this === minInput) minInput.value = maxVal - minGap;
      else maxInput.value = minVal + minGap;
      minVal = parseFloat(minInput.value);
      maxVal = parseFloat(maxInput.value);
    }

    const leftPercent = ((minVal - minValue) / (maxValue - minValue)) * 100;
    const rightPercent = ((maxVal - minValue) / (maxValue - minValue)) * 100;

    rangeDiv.style.left = leftPercent + "%";
    rangeDiv.style.width = rightPercent - leftPercent + "%";

    display.textContent = minVal.toFixed(1) + " – " + maxVal.toFixed(1);
  }

  minInput.addEventListener("input", updateRange);
  maxInput.addEventListener("input", updateRange);

  updateRange.call(minInput);
});
