const calc = {
  getRest: function() {
    const now = new Date();

    let hh, mm;
    if (now.getHours() < 12) {
      hh = 12;
      mm = 0;
    } else {
      hh = 17;
      mm = 30;
    }

    const restMSec =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hh,
        mm
      ).getTime() - now.getTime();
    const restMin = restMSec / 1000;
    return restMin;
  }
};

module.exports = calc;
