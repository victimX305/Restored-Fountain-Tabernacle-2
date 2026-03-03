(function () {
  'use strict';

  const form = document.getElementById('membership-form');
  if (!form) return;

  const maritalSelect = document.getElementById('maritalStatus');
  const spouseSection = document.getElementById('spouse-section');
  const childrenSection = document.getElementById('children-section');
  const messageEl = document.getElementById('membership-form-message');

  function getRadioValue(name) {
    const checked = form.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : '';
  }

  function setError(key, message) {
    const errorEl = form.querySelector('[data-error-for="' + key + '"]');
    if (errorEl) {
      errorEl.textContent = message || '';
      const field = errorEl.closest('.form-field');
      if (field) {
        if (message) field.classList.add('form-field--invalid');
        else field.classList.remove('form-field--invalid');
      }
    }
  }

  function clearAllErrors() {
    form.querySelectorAll('.form-field__error').forEach((el) => {
      el.textContent = '';
    });
    form.querySelectorAll('.form-field--invalid').forEach((el) => {
      el.classList.remove('form-field--invalid');
    });
    if (messageEl) {
      messageEl.textContent = '';
      messageEl.classList.remove('form-global-message--error', 'form-global-message--success');
    }
  }

  function showSection(section, show) {
    if (!section) return;
    section.style.display = show ? '' : 'none';
    section.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  function updateSpouseVisibility() {
    const isMarried = maritalSelect && maritalSelect.value === 'Married';
    showSection(spouseSection, isMarried);
    if (!isMarried) {
      ['spouseName', 'spouseSurname', 'spouseCellNumber', 'spouseIdNumber', 'spouseHomeAddress',
        'spouseBornAgain', 'spouseBaptized', 'spouseEmployed'
      ].forEach((key) => setError(key, ''));
    }
  }

  function updateChildrenVisibility() {
    const hasChildren = getRadioValue('hasChildren') === 'yes';
    showSection(childrenSection, hasChildren);
    if (!hasChildren) {
      ['numberOfChildren', 'childrenDedicatedToGod', 'childrenAcceptedJesus', 'childrenBaptized',
        'child1Name', 'child1Surname', 'child1IdNumber', 'child1Age',
        'child2Name', 'child2Surname', 'child2IdNumber', 'child2Age',
        'child3Name', 'child3Surname', 'child3IdNumber', 'child3Age'
      ].forEach((key) => setError(key, ''));
    }
  }

  function validate() {
    clearAllErrors();
    let valid = true;

    function requireField(id, label) {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) {
        setError(id, label + ' is required.');
        valid = false;
      }
    }

    function requireRadio(name, label) {
      if (!getRadioValue(name)) {
        setError(name, label + ' is required.');
        valid = false;
      }
    }

    // Personal details
    requireField('name', 'Name');
    requireField('surname', 'Surname');
    requireField('cellNumber', 'Cell number');
    requireField('homeAddress', 'Home address');
    requireField('age', 'Age');
    requireField('maritalStatus', 'Marital status');
    requireRadio('baptized', 'Baptism status');
    requireRadio('southAfricanCitizen', 'Citizenship');
    requireRadio('employed', 'Employment status');
    requireRadio('scholar', 'Scholar / student status');
    requireRadio('hasChildren', 'Children status');

    const southAfricanCitizen = getRadioValue('southAfricanCitizen');
    if (southAfricanCitizen === 'yes') {
      requireField('idNumber', 'ID number');
    }

    const hasChildren = getRadioValue('hasChildren') === 'yes';
    const maritalStatus = maritalSelect ? maritalSelect.value : '';

    // Spouse details (only when married)
    if (maritalStatus === 'Married') {
      requireField('spouseName', 'Spouse name');
      requireField('spouseSurname', 'Spouse surname');
      requireField('spouseCellNumber', 'Spouse cell number');
      requireField('spouseIdNumber', 'Spouse ID number');
      requireField('spouseHomeAddress', 'Spouse home address');
      requireRadio('spouseBornAgain', 'Spouse born-again status');
      requireRadio('spouseBaptized', 'Spouse baptism status');
      requireRadio('spouseEmployed', 'Spouse employment status');
    }

    // Children details (only when hasChildren = yes)
    if (hasChildren) {
      requireField('numberOfChildren', 'Number of children');
      const countEl = document.getElementById('numberOfChildren');
      const count = countEl && countEl.value ? parseInt(countEl.value, 10) : 0;
      if (countEl && (isNaN(count) || count < 1 || count > 3)) {
        setError('numberOfChildren', 'Number of children must be between 1 and 3.');
        valid = false;
      }

      // For each child up to numberOfChildren, require basic details
      const maxChildren = Math.min(Math.max(count, 0), 3);
      for (let i = 1; i <= maxChildren; i++) {
        requireField('child' + i + 'Name', 'Child ' + i + ' name');
        requireField('child' + i + 'Surname', 'Child ' + i + ' surname');
        requireField('child' + i + 'IdNumber', 'Child ' + i + ' ID number');
        requireField('child' + i + 'Age', 'Child ' + i + ' age');
      }

      requireRadio('childrenDedicatedToGod', 'Children dedication status');
      requireRadio('childrenAcceptedJesus', 'Children salvation status');
      requireRadio('childrenBaptized', 'Children baptism status');
    }

    return valid;
  }

  if (maritalSelect) {
    maritalSelect.addEventListener('change', updateSpouseVisibility);
  }
  form.querySelectorAll('input[name="hasChildren"]').forEach((el) => {
    el.addEventListener('change', updateChildrenVisibility);
  });

  // Init visibility on load
  updateSpouseVisibility();
  updateChildrenVisibility();

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!validate()) {
      if (messageEl) {
        messageEl.textContent = 'Please correct the highlighted fields and try again.';
        messageEl.classList.add('form-global-message--error');
      }
      return;
    }

    if (messageEl) {
      messageEl.textContent = '';
      messageEl.classList.remove('form-global-message--error', 'form-global-message--success');
    }

    // Build document for Firestore
    const db = firebase && firebase.firestore ? firebase.firestore() : null;
    if (!db) {
      if (messageEl) {
        messageEl.textContent = 'Unable to connect to the database. Please try again later.';
        messageEl.classList.add('form-global-message--error');
      }
      return;
    }

    function value(id) {
      const el = document.getElementById(id);
      return el && el.value ? el.value.trim() : '';
    }

    const maritalStatus = maritalSelect ? maritalSelect.value : '';
    const southAfricanCitizen = getRadioValue('southAfricanCitizen');
    const hasChildren = getRadioValue('hasChildren') === 'yes';
    const numberOfChildrenValue = value('numberOfChildren');
    const numberOfChildren = hasChildren && numberOfChildrenValue ? parseInt(numberOfChildrenValue, 10) : 0;

    const children = [];
    const maxChildren = Math.min(Math.max(numberOfChildren, 0), 3);
    for (let i = 1; i <= maxChildren; i++) {
      children.push({
        name: value('child' + i + 'Name'),
        surname: value('child' + i + 'Surname'),
        idNumber: value('child' + i + 'IdNumber'),
        age: value('child' + i + 'Age'),
        cellNumber: value('child' + i + 'CellNumber')
      });
    }

    const doc = {
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'new',
      personal: {
        name: value('name'),
        surname: value('surname'),
        cellNumber: value('cellNumber'),
        homeAddress: value('homeAddress'),
        maritalStatus: maritalStatus,
        baptized: getRadioValue('baptized'),
        southAfricanCitizen: southAfricanCitizen,
        idNumber: value('idNumber'),
        age: value('age'),
        employed: getRadioValue('employed'),
        scholar: getRadioValue('scholar'),
        hasChildren: hasChildren,
        numberOfChildren: numberOfChildren
      },
      spouse: maritalStatus === 'Married' ? {
        name: value('spouseName'),
        surname: value('spouseSurname'),
        cellNumber: value('spouseCellNumber'),
        idNumber: value('spouseIdNumber'),
        homeAddress: value('spouseHomeAddress'),
        bornAgain: getRadioValue('spouseBornAgain'),
        baptized: getRadioValue('spouseBaptized'),
        employed: getRadioValue('spouseEmployed')
      } : null,
      childrenInfo: {
        hasChildren: hasChildren,
        numberOfChildren: numberOfChildren,
        children: children,
        dedicatedToGod: hasChildren ? getRadioValue('childrenDedicatedToGod') : '',
        acceptedJesus: hasChildren ? getRadioValue('childrenAcceptedJesus') : '',
        baptized: hasChildren ? getRadioValue('childrenBaptized') : ''
      }
    };

    try {
      await db.collection('members').add(doc);
    } catch (err) {
      console.error(err);
      if (messageEl) {
        messageEl.textContent = 'We could not save your application. Please try again.';
        messageEl.classList.add('form-global-message--error');
      }
      return;
    }

    // Show toast then redirect away from membership page
    const redirect = function () {
      window.location.href = 'index.html';
    };

    if (typeof Swal !== 'undefined' && Swal && Swal.fire) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Thank you. Your membership application has been captured.',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      }).then(redirect);
    } else {
      setTimeout(redirect, 2000);
    }

    form.reset();
    updateSpouseVisibility();
    updateChildrenVisibility();
  });
})();

