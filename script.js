const TARIFFS = {
  officeOffice: 1870,
  officeAddress: 2600,
  addressAddress: 3350,
  business: 2800,
  cityKg: 2100,
  cityBusinessKv: 1660
};

const form = document.getElementById("delivery-form");
const errorMessageEl = document.getElementById("error-message");
const resultsEl = document.getElementById("results");

const actualWeightEl = document.getElementById("actual-weight");
const dimWeightEl = document.getElementById("dim-weight");
const usedWeightEl = document.getElementById("used-weight");

const priceOfficeOfficeEl = document.getElementById("price-office-office");
const priceOfficeAddressEl = document.getElementById("price-office-address");
const priceAddressAddressEl = document.getElementById("price-address-address");
const priceBusinessEl = document.getElementById("price-business");
const priceCityKgEl = document.getElementById("price-city-kg");
const priceCityBusinessKvEl = document.getElementById("price-city-business-kv");
const priceRailEl = document.getElementById("price-rail");
const emailNoticeInput = document.getElementById("service-email-notice");
const returnWaybillInput = document.getElementById("service-return-waybill");
const urgentInput = document.getElementById("service-urgent");
const personalInput = document.getElementById("service-personal");
const extraPackagingInput = document.getElementById("service-extra-packaging");
const timeTenderInput = document.getElementById("service-time-tender");

const inputIds = ["weight", "length", "width", "height"];
const inputElements = inputIds.map((id) => document.getElementById(id));

function formatNumber(value) {
  return Number(value).toFixed(2);
}

function formatTenge(value) {
  return Math.round(Number(value)).toLocaleString("ru-RU");
}

function roundUpToHalf(value) {
  return Math.ceil(value * 2) / 2;
}

function normalizeDecimalInput(value) {
  return value.replace(",", ".");
}

function validateInputs(weightValue, dimensionValues) {
  const errors = [];

  if (weightValue === "" || Number.isNaN(Number(weightValue))) {
    errors.push('Поле "Вес" обязательно для заполнения.');
  } else if (Number(weightValue) <= 0) {
    errors.push('Поле "Вес" должно быть больше 0.');
  }

  const hasAnyDimension = dimensionValues.some(({ value }) => value !== "");
  const hasAllDimensions = dimensionValues.every(({ value }) => value !== "");

  if (hasAnyDimension && !hasAllDimensions) {
    errors.push("Чтобы учитывать габаритный вес, заполните длину, ширину и высоту.");
  }

  dimensionValues.forEach(({ value, label }) => {
    if (value === "") {
      return;
    }

    if (Number.isNaN(Number(value))) {
      errors.push(`Поле "${label}" должно быть числом.`);
      return;
    }

    if (Number(value) <= 0) {
      errors.push(`Поле "${label}" должно быть больше 0.`);
    }
  });

  return errors;
}

function calculateDeliveryPrice(usedWeight, tariff) {
  return ((usedWeight - 0.5) / 0.5) * 520 + tariff;
}

function calculateRailPrice(weight) {
  const roundedRailWeight = Math.ceil(weight);

  if (roundedRailWeight >= 0 && roundedRailWeight <= 25) {
    return 10100;
  }

  if (roundedRailWeight > 25 && roundedRailWeight <= 50) {
    return roundedRailWeight * 400;
  }

  if (roundedRailWeight > 50 && roundedRailWeight <= 100) {
    return roundedRailWeight * 370;
  }

  if (roundedRailWeight > 100 && roundedRailWeight <= 200) {
    return roundedRailWeight * 340;
  }

  if (roundedRailWeight > 200 && roundedRailWeight <= 300) {
    return roundedRailWeight * 305;
  }

  if (roundedRailWeight > 300 && roundedRailWeight <= 400) {
    return roundedRailWeight * 300;
  }

  if (roundedRailWeight > 400 && roundedRailWeight <= 500) {
    return roundedRailWeight * 280;
  }

  return "custom pricing";
}

function calculateServicesSurcharge(usedWeight) {
  const stepByTenKg = Math.ceil(usedWeight / 10);
  let surcharge = 0;

  if (emailNoticeInput.checked) {
    surcharge += 450;
  }

  if (returnWaybillInput.checked) {
    surcharge += 1100;
  }

  if (urgentInput.checked) {
    surcharge += 2100 * stepByTenKg;
  }

  if (personalInput.checked) {
    surcharge += 2600 * stepByTenKg;
  }

  if (timeTenderInput.checked) {
    surcharge += 2600 * stepByTenKg;
  }

  if (extraPackagingInput.checked) {
    if (usedWeight <= 5) {
      surcharge += 1100;
    } else if (usedWeight <= 10) {
      surcharge += 1600;
    } else {
      surcharge += 1600 + Math.ceil(usedWeight - 10) * 265;
    }
  }

  return surcharge;
}

function showError(message) {
  errorMessageEl.textContent = message;
  resultsEl.classList.add("hidden");
}

function clearError() {
  errorMessageEl.textContent = "";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const [weightInput, lengthInput, widthInput, heightInput] = inputElements;
  const normalizedWeight = normalizeDecimalInput(weightInput.value.trim());
  weightInput.value = normalizedWeight;
  const dimensionValues = [
    { value: lengthInput.value.trim(), label: "Длина", inputEl: lengthInput },
    { value: widthInput.value.trim(), label: "Ширина", inputEl: widthInput },
    { value: heightInput.value.trim(), label: "Высота", inputEl: heightInput }
  ];

  const errors = validateInputs(normalizedWeight, dimensionValues);
  weightInput.classList.remove("invalid");
  dimensionValues.forEach(({ inputEl }) => inputEl.classList.remove("invalid"));

  if (errors.length > 0) {
    if (errors[0].includes("Вес")) {
      weightInput.classList.add("invalid");
    } else {
      dimensionValues.forEach(({ inputEl }) => inputEl.classList.add("invalid"));
    }
    showError(errors[0]);
    return;
  }

  clearError();

  const actualWeight = Number(weightInput.value);
  const hasAllDimensions = [lengthInput, widthInput, heightInput].every(
    (input) => input.value.trim() !== ""
  );
  const length = hasAllDimensions ? Number(lengthInput.value) : 0;
  const width = hasAllDimensions ? Number(widthInput.value) : 0;
  const height = hasAllDimensions ? Number(heightInput.value) : 0;

  const dimensionalWeight = hasAllDimensions ? (length * width * height) / 5000 : 0;
  const weightForCalculation = Math.max(actualWeight, dimensionalWeight);
  const roundedUsedWeight = roundUpToHalf(weightForCalculation);
  const servicesSurcharge = calculateServicesSurcharge(roundedUsedWeight);

  const officeOfficePrice =
    calculateDeliveryPrice(roundedUsedWeight, TARIFFS.officeOffice) + servicesSurcharge;
  const officeAddressPrice =
    calculateDeliveryPrice(roundedUsedWeight, TARIFFS.officeAddress) + servicesSurcharge;
  const addressAddressPrice =
    calculateDeliveryPrice(roundedUsedWeight, TARIFFS.addressAddress) + servicesSurcharge;
  const businessPrice =
    calculateDeliveryPrice(roundedUsedWeight, TARIFFS.business) + servicesSurcharge;
  const cityKgPrice =
    calculateDeliveryPrice(roundedUsedWeight, TARIFFS.cityKg) + servicesSurcharge;
  const cityBusinessKvPrice =
    calculateDeliveryPrice(roundedUsedWeight, TARIFFS.cityBusinessKv) + servicesSurcharge;
  const railBasePrice = calculateRailPrice(roundedUsedWeight);
  const railPrice =
    typeof railBasePrice === "number" ? railBasePrice + servicesSurcharge : railBasePrice;

  actualWeightEl.textContent = `${formatNumber(actualWeight)} кг`;
  dimWeightEl.textContent = `${formatNumber(dimensionalWeight)} кг`;
  usedWeightEl.textContent = `${formatNumber(roundedUsedWeight)} кг`;

  priceOfficeOfficeEl.textContent = `${formatTenge(officeOfficePrice)} ₸`;
  priceOfficeAddressEl.textContent = `${formatTenge(officeAddressPrice)} ₸`;
  priceAddressAddressEl.textContent = `${formatTenge(addressAddressPrice)} ₸`;
  priceBusinessEl.textContent = `${formatTenge(businessPrice)} ₸`;
  priceCityKgEl.textContent = `${formatTenge(cityKgPrice)} ₸`;
  priceCityBusinessKvEl.textContent = `${formatTenge(cityBusinessKvPrice)} ₸`;
  priceRailEl.textContent =
    typeof railPrice === "number" ? `${formatTenge(railPrice)} ₸` : railPrice;

  resultsEl.classList.remove("hidden");
});
