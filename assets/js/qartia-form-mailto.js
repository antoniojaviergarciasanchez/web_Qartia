(function () {
  "use strict";

  var DESTINATION_EMAIL = "info@qartia.com";
  var SEND_BUTTON_RE = /enviar\s+consulta/i;
  var PRIVACY_RE = /privacidad|pol[ií]tica/i;
  var lastHandledAt = 0;

  function getText(element) {
    return ((element && (element.textContent || element.value)) || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function resetGravityFormFlags() {
    Object.keys(window).forEach(function (key) {
      if (/^gf_submitting_/.test(key)) {
        window[key] = false;
      }
    });
  }

  function getScope(control) {
    if (!control || !control.closest) {
      return document;
    }

    return control.closest("form") || control.closest("section") || document;
  }

  function findLabelByFor(scope, id) {
    if (!id || !scope.querySelector) {
      return null;
    }

    try {
      var safeId = String(id).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return scope.querySelector('label[for="' + safeId + '"]');
    } catch (error) {
      return null;
    }
  }

  function getFieldLabel(field, scope) {
    var labelByFor = findLabelByFor(scope, field.id);
    var closestLabel = field.closest && field.closest("label");
    var label =
      getText(labelByFor) ||
      getText(closestLabel) ||
      field.getAttribute("placeholder") ||
      field.getAttribute("aria-label") ||
      field.name ||
      field.id ||
      "Campo";

    return label.replace(/\s*\*$/, "");
  }

  function findPrivacyCheckbox(scope) {
    var checkboxes = Array.prototype.slice.call(
      scope.querySelectorAll ? scope.querySelectorAll('input[type="checkbox"]') : []
    );

    return checkboxes.find(function (checkbox) {
      var parentText = getText(checkbox.closest && checkbox.closest("label")) || getText(checkbox.parentElement);
      var label = getFieldLabel(checkbox, scope);
      return PRIVACY_RE.test([checkbox.name, checkbox.id, label, parentText].join(" "));
    });
  }

  function isVisible(field) {
    return !!(field.offsetWidth || field.offsetHeight || field.getClientRects().length);
  }

  function findMissingRequiredField(scope) {
    var fields = Array.prototype.slice.call(
      scope.querySelectorAll ? scope.querySelectorAll("input, textarea, select") : []
    );

    return fields.find(function (field) {
      var type = (field.type || "").toLowerCase();

      if (["hidden", "submit", "button", "reset"].indexOf(type) !== -1) {
        return false;
      }

      if (!(field.required || field.getAttribute("aria-required") === "true")) {
        return false;
      }

      if (!isVisible(field)) {
        return false;
      }

      if (type === "checkbox" || type === "radio") {
        return !field.checked;
      }

      return !String(field.value || "").trim();
    });
  }

  function collectFormData(scope) {
    var fields = Array.prototype.slice.call(
      scope.querySelectorAll ? scope.querySelectorAll("input, textarea, select") : []
    );
    var privacyCheckbox = findPrivacyCheckbox(scope);
    var lines = [];

    fields.forEach(function (field) {
      var type = (field.type || "").toLowerCase();

      if (field === privacyCheckbox) {
        return;
      }

      if (["hidden", "submit", "button", "reset", "file", "password"].indexOf(type) !== -1) {
        return;
      }

      if ((type === "checkbox" || type === "radio") && !field.checked) {
        return;
      }

      var value = type === "checkbox" ? "Sí" : field.value;
      value = String(value || "").trim();

      if (!value) {
        return;
      }

      lines.push(getFieldLabel(field, scope) + ": " + value);
    });

    return lines;
  }

  function buildMailtoUrl(lines) {
    var pageTitle = document.title || "Web Qartia";
    var body = [
      "Nueva consulta desde la web de Qartia",
      "",
      "Página: " + pageTitle,
      "URL: " + window.location.href,
      "Fecha: " + new Date().toLocaleString("es-ES"),
      "",
      "Datos del formulario:",
      lines.length ? lines.join("\n") : "Sin datos rellenados."
    ].join("\n");

    return (
      "mailto:" +
      DESTINATION_EMAIL +
      "?subject=" +
      encodeURIComponent("Consulta desde " + pageTitle) +
      "&body=" +
      encodeURIComponent(body)
    );
  }

  function handleSend(event, scope) {
    if (event) {
      event.preventDefault();
    }

    resetGravityFormFlags();

    var now = Date.now();
    if (now - lastHandledAt < 750) {
      return false;
    }
    lastHandledAt = now;

    var privacyCheckbox = findPrivacyCheckbox(scope);
    if (privacyCheckbox && !privacyCheckbox.checked) {
      alert("Debes aceptar la política de privacidad para enviar la consulta.");
      if (privacyCheckbox.focus) {
        privacyCheckbox.focus();
      }
      return false;
    }

    var missingField = findMissingRequiredField(scope);
    if (missingField) {
      alert("Completa los campos obligatorios antes de enviar la consulta.");
      if (missingField.focus) {
        missingField.focus();
      }
      return false;
    }

    window.location.href = buildMailtoUrl(collectFormData(scope));
    return false;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var controls = Array.prototype.slice
      .call(document.querySelectorAll("button, input[type='submit'], input[type='button']"))
      .filter(function (control) {
        return SEND_BUTTON_RE.test(getText(control));
      });
    var forms = [];

    controls.forEach(function (control) {
      var scope = getScope(control);

      if (scope.tagName === "FORM" && forms.indexOf(scope) === -1) {
        forms.push(scope);
      }

      control.addEventListener("click", function (event) {
        handleSend(event, scope);
      });
    });

    forms.forEach(function (form) {
      form.addEventListener("submit", function (event) {
        handleSend(event, form);
      });
    });
  });
})();
