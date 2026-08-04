let currentStep = 0;
const totalSteps = 7;
let selectedTemplate = 'classic';
let resumeData = {
  id: null,
  userId: null,
  title: '',
  template: 'classic',
  personalInfo: {
    fullName: '',
    birthDate: '',
    phone: '',
    email: '',
    linkedin: ''
  },
  summary: '',
  experiences: [],
  education: [],
  languages: [],
  skills: [],
  createdAt: null,
  updatedAt: null,
  isFavorite: false,
  views: 0,
  likes: 0
};

const translations = {
  'month.jan': 'Jan', 'month.feb': 'Fev', 'month.mar': 'Mar', 'month.apr': 'Abr',
  'month.may': 'Mai', 'month.jun': 'Jun', 'month.jul': 'Jul', 'month.aug': 'Ago',
  'month.sep': 'Set', 'month.oct': 'Out', 'month.nov': 'Nov', 'month.dec': 'Dez'
};

const availableLanguages = [
  'Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão',
  'Italiano', 'Japonês', 'Chinês', 'Russo', 'Árabe'
];

const languageLevels = [
  { value: 'basic', label: 'Básico' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
  { value: 'fluent', label: 'Fluente' },
  { value: 'native', label: 'Nativo' }
];

function t(key) {
  return translations[key] || key;
}

function selectTemplate(templateName) {
  selectedTemplate = templateName;
  resumeData.template = templateName;

  document.querySelectorAll('.template-card').forEach(card => {
    card.classList.remove('selected');
  });

  document.querySelector(`.template-card[data-template="${templateName}"]`).classList.add('selected');

  updatePreview();
}

function checkAuth() {
  const session = localStorage.getItem('setresume_session');
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return JSON.parse(session);
}

document.addEventListener('DOMContentLoaded', () => {
  const session = checkAuth();
  if (!session) return;

  resumeData.userId = session.id;

  const urlParams = new URLSearchParams(window.location.search);
  const resumeId = urlParams.get('id');

  if (resumeId) {
    loadResumeForEdit(resumeId);
  } else {
    resumeData.id = Date.now().toString();
    resumeData.createdAt = new Date().toISOString();
  }

  setupRealtimePreview();

  updateStepDisplay();
  updatePreview();
});

function loadResumeForEdit(resumeId) {
  const resumes = JSON.parse(localStorage.getItem('setresume_resumes')) || [];
  const resume = resumes.find(r => r.id === resumeId);

  if (resume && resume.userId === resumeData.userId) {
    resumeData = { ...resume };
    populateForm();
  }
}

function populateForm() {
  selectedTemplate = resumeData.template || 'classic';
  document.querySelectorAll('.template-card').forEach(card => card.classList.remove('selected'));
  const tplCard = document.querySelector(`.template-card[data-template="${selectedTemplate}"]`);
  if (tplCard) tplCard.classList.add('selected');

  const fullNameInput = document.getElementById('fullName');
  const birthDateInput = document.getElementById('birthDate');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');
  const linkedinInput = document.getElementById('linkedin');

  if (fullNameInput) fullNameInput.value = resumeData.personalInfo.fullName || '';
  if (birthDateInput) birthDateInput.value = resumeData.personalInfo.birthDate || '';
  if (phoneInput) phoneInput.value = resumeData.personalInfo.phone || '';
  if (emailInput) emailInput.value = resumeData.personalInfo.email || '';
  if (linkedinInput) linkedinInput.value = resumeData.personalInfo.linkedin || '';

  const summaryInput = document.getElementById('summary');
  if (summaryInput) summaryInput.value = resumeData.summary || '';

  resumeData.experiences.forEach(() => addExperience());
  resumeData.experiences.forEach((exp, index) => {
    const container = document.querySelectorAll('#experienceList .list-item')[index];
    if (container) {
      container.querySelector('.exp-position').value = exp.position;
      container.querySelector('.exp-company').value = exp.company;
      container.querySelector('.exp-start').value = exp.startDate;
      container.querySelector('.exp-end').value = exp.endDate;
      container.querySelector('.exp-current').checked = exp.current;
      container.querySelector('.exp-description').value = exp.description;
      if (exp.current) container.querySelector('.exp-end').disabled = true;
    }
  });

  resumeData.education.forEach(() => addEducation());
  resumeData.education.forEach((edu, index) => {
    const container = document.querySelectorAll('#educationList .list-item')[index];
    if (container) {
      container.querySelector('.edu-degree').value = edu.degree;
      container.querySelector('.edu-institution').value = edu.institution;
      container.querySelector('.edu-start').value = edu.startDate;
      container.querySelector('.edu-end').value = edu.endDate;
      container.querySelector('.edu-current').checked = edu.current;
      if (edu.current) container.querySelector('.edu-end').disabled = true;
    }
  });

  resumeData.languages.forEach(lang => {
    addLanguageTag(lang);
  });

  resumeData.skills.forEach(skill => {
    addSkillTag(skill);
  });

  const resumeTitleInput = document.getElementById('resumeTitle');
  if (resumeTitleInput) resumeTitleInput.value = resumeData.title || '';

  updatePreview();
}

function nextStep() {
  if (validateCurrentStep()) {
    saveCurrentStepData();

    if (currentStep < totalSteps) {
      currentStep++;
      updateStepDisplay();
      updatePreview();
    }
  }
}

function previousStep() {
  if (currentStep > 0) {
    saveCurrentStepData();
    currentStep--;
    updateStepDisplay();
  }
}

function updateStepDisplay() {
  document.querySelectorAll('.step-content').forEach(content => {
    content.classList.remove('active');
  });
  const activeContent = document.querySelector(`.step-content[data-step="${currentStep}"]`);
  if (activeContent) activeContent.classList.add('active');

  document.querySelectorAll('.step').forEach((step, index) => {
    step.classList.remove('active', 'completed');
    if (index + 1 < currentStep) {
      step.classList.add('completed');
    } else if (index + 1 === currentStep) {
      step.classList.add('active');
    }
  });

  const progressSteps = document.getElementById('progressSteps');
  if (progressSteps) {
    if (currentStep === 0) {
      progressSteps.style.display = 'none';
    } else {
      progressSteps.style.display = 'flex';
    }
  }

  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnFinish = document.getElementById('btnFinish');

  if (btnPrev) btnPrev.style.display = currentStep === 0 ? 'none' : 'flex';
  if (btnNext) btnNext.style.display = currentStep === totalSteps ? 'none' : 'flex';
  if (btnFinish) btnFinish.style.display = currentStep === totalSteps ? 'flex' : 'none';

  if (currentStep === 0 && btnNext) {
    btnNext.innerHTML = 'Começar <i class="bi bi-arrow-right"></i>';
  } else if (btnNext) {
    btnNext.innerHTML = 'Próximo <i class="bi bi-arrow-right"></i>';
  }

  const editorSide = document.querySelector('.editor-side');
  if (editorSide) editorSide.scrollTop = 0;
}

function validateCurrentStep() {
  switch (currentStep) {
    case 0:
      if (!selectedTemplate) {
        alert('Por favor, selecione um template!');
        return false;
      }
      break;

    case 1:
      const fullName = document.getElementById('fullName')?.value.trim();
      const phone = document.getElementById('phone')?.value.trim();
      const email = document.getElementById('email')?.value.trim();

      if (!fullName || !phone || !email) {
        alert('Por favor, preencha todos os campos obrigatórios!');
        return false;
      }
      break;

    case 2:
      const summary = document.getElementById('summary')?.value.trim();
      if (!summary) {
        alert('Por favor, adicione um resumo profissional!');
        return false;
      }
      break;

    case 7:
      const title = document.getElementById('resumeTitle')?.value.trim();
      if (!title) {
        alert('Por favor, adicione um título para o currículo!');
        return false;
      }
      break;
  }

  return true;
}

function saveCurrentStepData() {
  switch (currentStep) {
    case 1:
      resumeData.personalInfo = {
        fullName: document.getElementById('fullName')?.value.trim() || '',
        birthDate: document.getElementById('birthDate')?.value || '',
        phone: document.getElementById('phone')?.value.trim() || '',
        email: document.getElementById('email')?.value.trim() || '',
        linkedin: document.getElementById('linkedin')?.value.trim() || ''
      };
      break;

    case 2:
      resumeData.summary = document.getElementById('summary')?.value.trim() || '';
      break;

    case 3:
      saveExperiences();
      break;

    case 4:
      saveEducation();
      break;

    case 7:
      resumeData.title = document.getElementById('resumeTitle')?.value.trim() || '';
      updateReview();
      break;
  }
}

function addExperience() {
  const container = document.getElementById('experienceList');
  if (!container) return;

  const index = container.children.length;

  const html = `
    <div class="list-item">
      <div class="list-item-header">
        <div class="list-item-title">Experiência ${index + 1}</div>
        <button class="remove-item-btn" onclick="removeExperience(this)">
          <i class="bi bi-x-circle"></i>
        </button>
      </div>

      <div class="form-group">
        <label class="form-label">Cargo</label>
        <input type="text" class="form-input exp-position" placeholder="Desenvolvedor Full Stack">
      </div>

      <div class="form-group">
        <label class="form-label">Empresa</label>
        <input type="text" class="form-input exp-company" placeholder="Tech Company">
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Data de Início</label>
          <input type="month" class="form-input exp-start">
        </div>
        <div class="form-group">
          <label class="form-label">Data de Término</label>
          <input type="month" class="form-input exp-end">
        </div>
      </div>

      <div class="checkbox-wrapper">
        <input type="checkbox" class="exp-current" onchange="toggleEndDate(this)">
        <label>Trabalho aqui atualmente</label>
      </div>

      <div class="form-group">
        <label class="form-label">Descrição</label>
        <textarea class="form-textarea exp-description" placeholder="Descreva suas responsabilidades e conquistas..."></textarea>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', html);
  updatePreview();
}

function removeExperience(btn) {
  btn.closest('.list-item').remove();
  saveExperiences();
  updatePreview();
}

function toggleEndDate(checkbox) {
  const container = checkbox.closest('.list-item');
  const endDateInput = container.querySelector('.exp-end');
  endDateInput.disabled = checkbox.checked;
  if (checkbox.checked) {
    endDateInput.value = '';
  }
  updatePreview();
}

function saveExperiences() {
  resumeData.experiences = [];
  document.querySelectorAll('#experienceList .list-item').forEach(item => {
    const exp = {
      position: item.querySelector('.exp-position').value.trim(),
      company: item.querySelector('.exp-company').value.trim(),
      startDate: item.querySelector('.exp-start').value,
      endDate: item.querySelector('.exp-end').value,
      current: item.querySelector('.exp-current').checked,
      description: item.querySelector('.exp-description').value.trim()
    };

    if (exp.position || exp.company) {
      resumeData.experiences.push(exp);
    }
  });
}

function addEducation() {
  const container = document.getElementById('educationList');
  if (!container) return;

  const index = container.children.length;

  const html = `
    <div class="list-item">
      <div class="list-item-header">
        <div class="list-item-title">Formação ${index + 1}</div>
        <button class="remove-item-btn" onclick="removeEducation(this)">
          <i class="bi bi-x-circle"></i>
        </button>
      </div>

      <div class="form-group">
        <label class="form-label">Curso</label>
        <input type="text" class="form-input edu-degree" placeholder="Bacharelado em Ciência da Computação">
      </div>

      <div class="form-group">
        <label class="form-label">Instituição</label>
        <input type="text" class="form-input edu-institution" placeholder="Universidade XYZ">
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Data de Início</label>
          <input type="month" class="form-input edu-start">
        </div>
        <div class="form-group">
          <label class="form-label">Data de Conclusão</label>
          <input type="month" class="form-input edu-end">
        </div>
      </div>

      <div class="checkbox-wrapper">
        <input type="checkbox" class="edu-current" onchange="toggleEduEndDate(this)">
        <label>Cursando atualmente</label>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', html);
  updatePreview();
}

function removeEducation(btn) {
  btn.closest('.list-item').remove();
  saveEducation();
  updatePreview();
}

function toggleEduEndDate(checkbox) {
  const container = checkbox.closest('.list-item');
  const endDateInput = container.querySelector('.edu-end');
  endDateInput.disabled = checkbox.checked;
  if (checkbox.checked) {
    endDateInput.value = '';
  }
  updatePreview();
}

function saveEducation() {
  resumeData.education = [];
  document.querySelectorAll('#educationList .list-item').forEach(item => {
    const edu = {
      degree: item.querySelector('.edu-degree').value.trim(),
      institution: item.querySelector('.edu-institution').value.trim(),
      startDate: item.querySelector('.edu-start').value,
      endDate: item.querySelector('.edu-end').value,
      current: item.querySelector('.edu-current').checked
    };

    if (edu.degree || edu.institution) {
      resumeData.education.push(edu);
    }
  });
}

function addLanguage() {
  const languageSelect = document.getElementById('languageSelect');
  const levelSelect = document.getElementById('levelSelect');

  if (!languageSelect || !levelSelect) return;

  const language = languageSelect.value;
  const level = levelSelect.value;

  if (!language || !level) {
    alert('Por favor, selecione um idioma e um nível!');
    return;
  }

  const exists = resumeData.languages.some(lang => lang.language === language);
  if (exists) {
    alert('Este idioma já foi adicionado!');
    return;
  }

  const languageData = { language, level };
  resumeData.languages.push(languageData);
  addLanguageTag(languageData);

  languageSelect.selectedIndex = 0;
  levelSelect.selectedIndex = 0;

  updatePreview();
}

function addLanguageTag(languageData) {
  const container = document.getElementById('languagesTags');
  if (!container) return;

  const tag = document.createElement('div');
  tag.className = 'tag';

  const levelLabel = languageLevels.find(l => l.value === languageData.level)?.label || languageData.level;

  tag.innerHTML = `
    <span><strong>${languageData.language}</strong> - ${levelLabel}</span>
    <button class="tag-remove" onclick="removeLanguage('${languageData.language}')">
      <i class="bi bi-x"></i>
    </button>
  `;
  container.appendChild(tag);
}

function removeLanguage(language) {
  resumeData.languages = resumeData.languages.filter(l => l.language !== language);
  renderLanguages();
  updatePreview();
}

function renderLanguages() {
  const container = document.getElementById('languagesTags');
  if (!container) return;

  container.innerHTML = '';
  resumeData.languages.forEach(lang => addLanguageTag(lang));
}

function addSkill() {
  const input = document.getElementById('skillInput');
  if (!input) return;

  const value = input.value.trim();

  if (value) {
    if (!resumeData.skills.includes(value)) {
      resumeData.skills.push(value);
      addSkillTag(value);
      input.value = '';
      updatePreview();
    }
  }
}

function addSkillTag(skill) {
  const container = document.getElementById('skillsTags');
  if (!container) return;

  const tag = document.createElement('div');
  tag.className = 'tag';
  tag.innerHTML = `
    ${skill}
    <button class="tag-remove" onclick="removeSkill('${skill}')">
      <i class="bi bi-x"></i>
    </button>
  `;
  container.appendChild(tag);
}

function removeSkill(skill) {
  resumeData.skills = resumeData.skills.filter(s => s !== skill);
  renderSkills();
  updatePreview();
}

function renderSkills() {
  const container = document.getElementById('skillsTags');
  if (!container) return;

  container.innerHTML = '';
  resumeData.skills.forEach(skill => addSkillTag(skill));
}

function generateSummary() {
  const suggestions = [
    "Profissional com ampla experiência em desenvolvimento de soluções inovadoras, focado em resultados e trabalho em equipe.",
    "Especialista com sólida formação acadêmica e experiência prática, comprometido com excelência e aprendizado contínuo.",
    "Profissional dedicado com habilidades comprovadas em liderança, comunicação e resolução de problemas complexos."
  ];

  const random = suggestions[Math.floor(Math.random() * suggestions.length)];
  const summaryInput = document.getElementById('summary');
  if (summaryInput) {
    summaryInput.value = random;
    resumeData.summary = random;
    updatePreview();
  }
}

function suggestSkills() {
  const commonSkills = [
    'Comunicação',
    'Trabalho em Equipe',
    'Liderança',
    'Resolução de Problemas',
    'Gestão de Tempo',
    'Adaptabilidade',
    'Pensamento Crítico',
    'Criatividade'
  ];

  commonSkills.forEach(skill => {
    if (!resumeData.skills.includes(skill) && resumeData.skills.length < 10) {
      resumeData.skills.push(skill);
      addSkillTag(skill);
    }
  });

  updatePreview();
}

function updateReview() {
  const { personalInfo, summary, experiences, education, languages, skills } = resumeData;

  const reviewPersonal = document.getElementById('reviewPersonal');
  const reviewSummary = document.getElementById('reviewSummary');
  const reviewExperience = document.getElementById('reviewExperience');
  const reviewEducation = document.getElementById('reviewEducation');
  const reviewLanguages = document.getElementById('reviewLanguages');
  const reviewSkills = document.getElementById('reviewSkills');

  if (!reviewPersonal) return;

  reviewPersonal.textContent =
    personalInfo.fullName
      ? `${personalInfo.fullName}${personalInfo.birthDate ? ', ' + formatDate(personalInfo.birthDate) : ''}, ${personalInfo.email}`
      : 'Não preenchido';

  reviewSummary.textContent =
    summary ? `${summary.substring(0, 50)}...` : 'Não preenchido';

  reviewExperience.textContent =
    experiences.length > 0 ? `${experiences.length} experiência(s)` : 'Nenhuma';

  reviewEducation.textContent =
    education.length > 0 ? `${education.length} formação(ões)` : 'Nenhuma';

  reviewLanguages.textContent =
    languages.length > 0
      ? languages.map(l => {
        const levelLabel = languageLevels.find(lv => lv.value === l.level)?.label || l.level;
        return `${l.language} (${levelLabel})`;
      }).join(', ')
      : 'Nenhum';

  reviewSkills.textContent =
    skills.length > 0 ? skills.slice(0, 5).join(', ') + (skills.length > 5 ? '...' : '') : 'Nenhuma';
}

function setupRealtimePreview() {
  const inputs = document.querySelectorAll('.form-input, .form-textarea');
  inputs.forEach(input => {
    input.addEventListener('input', updatePreview);
  });
}

function updatePreview() {
  saveCurrentStepData();
  updateReview();

  const preview = document.getElementById('resumePreview');
  if (!preview) return;

  const { personalInfo } = resumeData;

  if (!personalInfo.fullName) {
    preview.innerHTML = `
      <div class="preview-placeholder">
        <i class="bi bi-file-earmark-text"></i>
        <p>Preencha os dados para ver o preview</p>
      </div>
    `;
    return;
  }

  switch (resumeData.template) {
    case 'modern':
      preview.innerHTML = renderModernTemplate();
      break;
    case 'minimal':
      preview.innerHTML = renderMinimalTemplate();
      break;
    case 'classic':
    default:
      preview.innerHTML = renderClassicTemplate();
      break;
  }
}

function renderClassicTemplate() {
  const { personalInfo, summary, experiences, education, languages, skills } = resumeData;

  return `
    <div class="resume-header-preview">
      <h1 class="resume-name">${personalInfo.fullName}</h1>
      ${personalInfo.birthDate ? `<div class="resume-birth-date"><i class="bi bi-calendar"></i> ${formatDate(personalInfo.birthDate)}</div>` : ''}
      <div class="resume-contact">
        ${personalInfo.phone ? `<div class="resume-contact-item"><i class="bi bi-telephone"></i> ${personalInfo.phone}</div>` : ''}
        ${personalInfo.email ? `<div class="resume-contact-item"><i class="bi bi-envelope"></i> ${personalInfo.email}</div>` : ''}
        ${personalInfo.linkedin ? `<div class="resume-contact-item"><i class="bi bi-linkedin"></i> ${personalInfo.linkedin}</div>` : ''}
      </div>
    </div>

    ${summary ? `
      <div class="resume-section">
        <h2 class="resume-section-title">Resumo Profissional</h2>
        <p class="resume-summary">${summary}</p>
      </div>
    ` : ''}

    ${experiences.length > 0 ? `
      <div class="resume-section">
        <h2 class="resume-section-title">Experiência Profissional</h2>
        ${experiences.map(exp => `
          <div class="resume-item">
            <div class="resume-item-header">
              <div>
                <div class="resume-item-title">${exp.position}</div>
                <div class="resume-item-subtitle">${exp.company}</div>
              </div>
              <div class="resume-item-date">
                ${formatMonthYear(exp.startDate)} - ${exp.current ? 'Atual' : formatMonthYear(exp.endDate)}
              </div>
            </div>
            ${exp.description ? `<p class="resume-item-description">${exp.description}</p>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${education.length > 0 ? `
      <div class="resume-section">
        <h2 class="resume-section-title">Formação Acadêmica</h2>
        ${education.map(edu => `
          <div class="resume-item">
            <div class="resume-item-header">
              <div>
                <div class="resume-item-title">${edu.degree}</div>
                <div class="resume-item-subtitle">${edu.institution}</div>
              </div>
              <div class="resume-item-date">
                ${formatMonthYear(edu.startDate)} - ${edu.current ? 'Cursando' : formatMonthYear(edu.endDate)}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${languages.length > 0 ? `
      <div class="resume-section">
        <h2 class="resume-section-title">Idiomas</h2>
        <div class="resume-languages">
          ${languages.map(lang => {
    const levelLabel = languageLevels.find(l => l.value === lang.level)?.label || lang.level;
    return `
              <div class="resume-language-item" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-weight: 500;">${lang.language}</span>
                <span style="color: var(--text-muted);">${levelLabel}</span>
              </div>
            `;
  }).join('')}
        </div>
      </div>
    ` : ''}

    ${skills.length > 0 ? `
      <div class="resume-section">
        <h2 class="resume-section-title">Habilidades</h2>
        <div class="resume-tags">
          ${skills.map(skill => `<span class="resume-tag">${skill}</span>`).join('')}
        </div>
      </div>
    ` : ''}
  `;
}

function renderModernTemplate() {
  const { personalInfo, summary, experiences, education, languages, skills } = resumeData;

  return `
    <div style="display: grid; grid-template-columns: 200px 1fr; min-height: 100%; gap: 0;">
      <div style="background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%); padding: 30px 20px; color: white;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 80px; height: 80px; background: rgba(251, 191, 36, 0.2); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; border: 3px solid #fbbf24;">
            ${personalInfo.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
          ${personalInfo.birthDate ? `<p style="font-size: 11px; margin-top: 10px; opacity: 0.8;">${formatDate(personalInfo.birthDate)}</p>` : ''}
        </div>

        ${personalInfo.phone || personalInfo.email || personalInfo.linkedin ? `
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; color: #fbbf24;">Contato</h3>
            ${personalInfo.phone ? `<p style="font-size: 11px; margin-bottom: 8px; word-break: break-word;"><i class="bi bi-telephone"></i> ${personalInfo.phone}</p>` : ''}
            ${personalInfo.email ? `<p style="font-size: 11px; margin-bottom: 8px; word-break: break-word;"><i class="bi bi-envelope"></i> ${personalInfo.email}</p>` : ''}
            ${personalInfo.linkedin ? `<p style="font-size: 11px; word-break: break-word;"><i class="bi bi-linkedin"></i> LinkedIn</p>` : ''}
          </div>
        ` : ''}

        ${languages.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; color: #fbbf24;">Idiomas</h3>
            ${languages.map(lang => {
    const levelLabel = languageLevels.find(l => l.value === lang.level)?.label || lang.level;
    return `<p style="font-size: 11px; margin-bottom: 6px;">• ${lang.language} <span style="opacity: 0.7;">(${levelLabel})</span></p>`;
  }).join('')}
          </div>
        ` : ''}

        ${skills.length > 0 ? `
          <div>
            <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; color: #fbbf24;">Habilidades</h3>
            ${skills.map(skill => `<p style="font-size: 11px; margin-bottom: 6px;">• ${skill}</p>`).join('')}
          </div>
        ` : ''}
      </div>

      <div style="padding: 30px 40px;">
        <div style="margin-bottom: 30px;">
          <h1 style="font-size: 36px; font-weight: 700; color: #1a1a1a; margin-bottom: 5px;">${personalInfo.fullName}</h1>
          <div style="width: 60px; height: 3px; background: #fbbf24;"></div>
        </div>

        ${summary ? `
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #1e3a8a; margin-bottom: 10px;">Resumo Profissional</h2>
            <p style="font-size: 13px; color: #444; line-height: 1.6;">${summary}</p>
          </div>
        ` : ''}

        ${experiences.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #1e3a8a; margin-bottom: 15px;">Experiência Profissional</h2>
            ${experiences.map(exp => `
              <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <strong style="font-size: 15px; color: #1a1a1a;">${exp.position}</strong>
                  <span style="font-size: 12px; color: #f59e0b;">${formatMonthYear(exp.startDate)} - ${exp.current ? 'Atual' : formatMonthYear(exp.endDate)}</span>
                </div>
                <div style="font-size: 13px; color: #666; margin-bottom: 8px;">${exp.company}</div>
                ${exp.description ? `<p style="font-size: 12px; color: #444; line-height: 1.5;">${exp.description}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${education.length > 0 ? `
          <div>
            <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #1e3a8a; margin-bottom: 15px;">Formação Acadêmica</h2>
            ${education.map(edu => `
              <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <strong style="font-size: 15px; color: #1a1a1a;">${edu.degree}</strong>
                  <span style="font-size: 12px; color: #f59e0b;">${formatMonthYear(edu.startDate)} - ${edu.current ? 'Cursando' : formatMonthYear(edu.endDate)}</span>
                </div>
                <div style="font-size: 13px; color: #666;">${edu.institution}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderMinimalTemplate() {
  const { personalInfo, summary, experiences, education, languages, skills } = resumeData;

  return `
    <div style="max-width: 650px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
        <h1 style="font-size: 32px; font-weight: 300; color: #1a1a1a; margin-bottom: 15px; letter-spacing: 3px; text-transform: uppercase;">
          ${personalInfo.fullName}
        </h1>
        ${personalInfo.birthDate ? `<div style="font-size: 12px; color: #999; margin-bottom: 10px;">${formatDate(personalInfo.birthDate)}</div>` : ''}
        <div style="font-size: 12px; color: #666; letter-spacing: 1px;">
          ${[personalInfo.phone, personalInfo.email, personalInfo.linkedin].filter(Boolean).join(' • ')}
        </div>
      </div>

      ${summary ? `
        <div style="margin-bottom: 35px;">
          <p style="font-size: 14px; color: #444; line-height: 1.8; text-align: justify;">${summary}</p>
        </div>
      ` : ''}

      ${experiences.length > 0 ? `
        <div style="margin-bottom: 35px;">
          <h2 style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #1a1a1a; margin-bottom: 20px; font-weight: 600;">Experiência</h2>
          ${experiences.map(exp => `
            <div style="margin-bottom: 25px; padding-left: 20px; border-left: 2px solid #e5e7eb;">
              <div style="margin-bottom: 8px;">
                <strong style="font-size: 14px; color: #1a1a1a; font-weight: 600;">${exp.position}</strong>
                <span style="font-size: 12px; color: #999; margin-left: 10px;">${formatMonthYear(exp.startDate)} - ${exp.current ? 'Atual' : formatMonthYear(exp.endDate)}</span>
              </div>
              <div style="font-size: 13px; color: #666; margin-bottom: 8px; font-style: italic;">${exp.company}</div>
              ${exp.description ? `<p style="font-size: 12px; color: #444; line-height: 1.6;">${exp.description}</p>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${education.length > 0 ? `
        <div style="margin-bottom: 35px;">
          <h2 style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #1a1a1a; margin-bottom: 20px; font-weight: 600;">Formação</h2>
          ${education.map(edu => `
            <div style="margin-bottom: 20px; padding-left: 20px; border-left: 2px solid #e5e7eb;">
              <div style="margin-bottom: 5px;">
                <strong style="font-size: 14px; color: #1a1a1a; font-weight: 600;">${edu.degree}</strong>
                <span style="font-size: 12px; color: #999; margin-left: 10px;">${formatMonthYear(edu.startDate)} - ${edu.current ? 'Cursando' : formatMonthYear(edu.endDate)}</span>
              </div>
              <div style="font-size: 13px; color: #666; font-style: italic;">${edu.institution}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        ${languages.length > 0 ? `
          <div>
            <h2 style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #1a1a1a; margin-bottom: 15px; font-weight: 600;">Idiomas</h2>
            <div style="font-size: 13px; color: #444; line-height: 2;">
              ${languages.map(lang => {
    const levelLabel = languageLevels.find(l => l.value === lang.level)?.label || lang.level;
    return `<div style="display: flex; justify-content: space-between;"><span>• ${lang.language}</span><span style="color: #999; font-size: 12px;">${levelLabel}</span></div>`;
  }).join('')}
            </div>
          </div>
        ` : ''}

        ${skills.length > 0 ? `
          <div>
            <h2 style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #1a1a1a; margin-bottom: 15px; font-weight: 600;">Habilidades</h2>
            <div style="font-size: 13px; color: #444; line-height: 2;">
              ${skills.map(skill => `<div>• ${skill}</div>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function finishResume() {
  if (!validateCurrentStep()) return;

  saveCurrentStepData();
  resumeData.updatedAt = new Date().toISOString();

  let resumes = JSON.parse(localStorage.getItem('setresume_resumes')) || [];

  const existingIndex = resumes.findIndex(r => r.id === resumeData.id);

  if (existingIndex !== -1) {
    resumes[existingIndex] = resumeData;
  } else {
    resumes.push(resumeData);
  }

  localStorage.setItem('setresume_resumes', JSON.stringify(resumes));

  alert('Currículo salvo com sucesso!');
  window.location.href = 'home.html';
}

document.getElementById('languageInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addLanguage();
  }
});

document.getElementById('skillInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addSkill();
  }
});

async function downloadPDF() {
  const btn = document.querySelector('.preview-action-btn[title="Baixar PDF"]');
  if (!btn) return;

  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i>';

  try {
    if (!resumeData.personalInfo.fullName) {
      alert('Preencha pelo menos os dados pessoais antes de baixar o PDF!');
      btn.innerHTML = originalText;
      return;
    }

    saveCurrentStepData();

    const pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'absolute';
    pdfContainer.style.left = '-9999px';
    pdfContainer.style.width = '210mm';
    pdfContainer.style.background = 'white';
    pdfContainer.style.padding = '20mm';
    pdfContainer.style.fontFamily = 'Arial, sans-serif';
    document.body.appendChild(pdfContainer);

    pdfContainer.innerHTML = generatePDFContent();

    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(pdfContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    document.body.removeChild(pdfContainer);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 0;
    const pageHeight = 297;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);

    let heightLeft = imgHeight - pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const fileName = resumeData.title
      ? `${resumeData.title.replace(/[^a-z0-9]/gi, '_')}.pdf`
      : `Curriculo_${resumeData.personalInfo.fullName.replace(/[^a-z0-9]/gi, '_')}.pdf`;

    pdf.save(fileName);

    alert('PDF baixado com sucesso!');

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Tente novamente.');
  } finally {
    btn.innerHTML = originalText;
  }
}

function generatePDFContent() {
  switch (resumeData.template) {
    case 'modern':
      return generateModernPDFContent();
    case 'minimal':
      return generateMinimalPDFContent();
    case 'classic':
    default:
      return generateClassicPDFContent();
  }
}

function generateClassicPDFContent() {
  const { personalInfo, summary, experiences, education, languages, skills } = resumeData;

  return `
    <div style="font-family: Arial, sans-serif; color: #1a1a1a; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1e3a8a;">
        <h1 style="font-size: 32px; color: #1e3a8a; margin: 0 0 10px 0; font-weight: 700;">
          ${personalInfo.fullName}
        </h1>
        ${personalInfo.birthDate ? `<div style="font-size: 13px; color: #666; margin-bottom: 10px;">📅 ${formatDate(personalInfo.birthDate)}</div>` : ''}
        <div style="font-size: 13px; color: #666;">
          ${personalInfo.phone ? `<span style="margin: 0 10px;">📞 ${personalInfo.phone}</span>` : ''}
          ${personalInfo.email ? `<span style="margin: 0 10px;">✉️ ${personalInfo.email}</span>` : ''}
          ${personalInfo.linkedin ? `<span style="margin: 0 10px;">🔗 ${personalInfo.linkedin}</span>` : ''}
        </div>
      </div>

      ${summary ? `
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 18px; color: #1e3a8a; margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #fbbf24;">
            RESUMO PROFISSIONAL
          </h2>
          <p style="margin: 0; font-size: 13px; color: #444;">
            ${summary}
          </p>
        </div>
      ` : ''}

      ${experiences.length > 0 ? `
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 18px; color: #1e3a8a; margin: 0 0 15px 0; padding-bottom: 5px; border-bottom: 2px solid #fbbf24;">
            EXPERIÊNCIA PROFISSIONAL
          </h2>
          ${experiences.map(exp => `
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <strong style="font-size: 14px; color: #1a1a1a;">${exp.position}</strong>
                <span style="font-size: 12px; color: #f59e0b; font-weight: 500;">
                  ${formatMonthYear(exp.startDate)} - ${exp.current ? 'Atual' : formatMonthYear(exp.endDate)}
                </span>
              </div>
              <div style="font-size: 13px; color: #666; margin-bottom: 5px;">
                ${exp.company}
              </div>
              ${exp.description ? `
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #444;">
                  ${exp.description}
                </p>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${education.length > 0 ? `
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 18px; color: #1e3a8a; margin: 0 0 15px 0; padding-bottom: 5px; border-bottom: 2px solid #fbbf24;">
            FORMAÇÃO ACADÊMICA
          </h2>
          ${education.map(edu => `
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <strong style="font-size: 14px; color: #1a1a1a;">${edu.degree}</strong>
                <span style="font-size: 12px; color: #f59e0b; font-weight: 500;">
                  ${formatMonthYear(edu.startDate)} - ${edu.current ? 'Cursando' : formatMonthYear(edu.endDate)}
                </span>
              </div>
              <div style="font-size: 13px; color: #666;">
                ${edu.institution}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${languages.length > 0 || skills.length > 0 ? `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          ${languages.length > 0 ? `
            <div>
              <h2 style="font-size: 18px; color: #1e3a8a; margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #fbbf24;">
                IDIOMAS
              </h2>
              <div>
                ${languages.map(lang => {
    const levelLabel = languageLevels.find(l => l.value === lang.level)?.label || lang.level;
    return `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
                      <strong>${lang.language}</strong>
                      <span style="color: #666;">${levelLabel}</span>
                    </div>
                  `;
  }).join('')}
              </div>
            </div>
          ` : ''}

          ${skills.length > 0 ? `
            <div>
              <h2 style="font-size: 18px; color: #1e3a8a; margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #fbbf24;">
                HABILIDADES
              </h2>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${skills.map(skill => `
                  <span style="display: inline-block; padding: 5px 12px; background: #1e3a8a; color: white; border-radius: 12px; font-size: 11px;">
                    ${skill}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #999;">
        Criado com SetResume
      </div>
    </div>
  `;
}

function generateModernPDFContent() {
  const { personalInfo, summary, experiences, education, languages, skills } = resumeData;

  return `
    <div style="font-family: Arial, sans-serif; display: grid; grid-template-columns: 200px 1fr; gap: 0; min-height: 100%;">
      <div style="background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%); padding: 30px 20px; color: white;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 80px; height: 80px; background: rgba(251, 191, 36, 0.2); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; border: 3px solid #fbbf24;">
            ${personalInfo.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
          ${personalInfo.birthDate ? `<p style="font-size: 10px; margin-top: 10px; opacity: 0.8;">📅 ${formatDate(personalInfo.birthDate)}</p>` : ''}
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; color: #fbbf24;">Contato</h3>
          ${personalInfo.phone ? `<p style="font-size: 10px; margin-bottom: 8px; word-break: break-all;">📞 ${personalInfo.phone}</p>` : ''}
          ${personalInfo.email ? `<p style="font-size: 10px; margin-bottom: 8px; word-break: break-all;">✉️ ${personalInfo.email}</p>` : ''}
          ${personalInfo.linkedin ? `<p style="font-size: 10px; word-break: break-all;">🔗 LinkedIn</p>` : ''}
        </div>

        ${languages.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; color: #fbbf24;">Idiomas</h3>
            ${languages.map(lang => {
    const levelLabel = languageLevels.find(l => l.value === lang.level)?.label || lang.level;
    return `<p style="font-size: 11px; margin-bottom: 6px;">• ${lang.language} <span style="opacity: 0.7;">(${levelLabel})</span></p>`;
  }).join('')}
          </div>
        ` : ''}

        ${skills.length > 0 ? `
          <div>
            <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; color: #fbbf24;">Habilidades</h3>
            ${skills.map(skill => `<p style="font-size: 11px; margin-bottom: 6px;">• ${skill}</p>`).join('')}
          </div>
        ` : ''}
      </div>

      <div style="padding: 30px 40px; background: white;">
        <div style="margin-bottom: 30px;">
          <h1 style="font-size: 32px; font-weight: 700; color: #1a1a1a; margin-bottom: 5px;">${personalInfo.fullName}</h1>
          <div style="width: 60px; height: 3px; background: #fbbf24;"></div>
        </div>

        ${summary ? `
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #1e3a8a; margin-bottom: 10px;">Resumo Profissional</h2>
            <p style="font-size: 12px; color: #444; line-height: 1.6;">${summary}</p>
          </div>
        ` : ''}

        ${experiences.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #1e3a8a; margin-bottom: 15px;">Experiência Profissional</h2>
            ${experiences.map(exp => `
              <div style="margin-bottom: 20px;">
                <div style="margin-bottom: 5px;">
                  <strong style="font-size: 13px; color: #1a1a1a;">${exp.position}</strong>
                  <span style="font-size: 11px; color: #f59e0b; margin-left: 10px;">${formatMonthYear(exp.startDate)} - ${exp.current ? 'Atual' : formatMonthYear(exp.endDate)}</span>
                </div>
                <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${exp.company}</div>
                ${exp.description ? `<p style="font-size: 11px; color: #444; line-height: 1.5;">${exp.description}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${education.length > 0 ? `
          <div>
            <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #1e3a8a; margin-bottom: 15px;">Formação Acadêmica</h2>
            ${education.map(edu => `
              <div style="margin-bottom: 15px;">
                <div style="margin-bottom: 5px;">
                  <strong style="font-size: 13px; color: #1a1a1a;">${edu.degree}</strong>
                  <span style="font-size: 11px; color: #f59e0b; margin-left: 10px;">${formatMonthYear(edu.startDate)} - ${edu.current ? 'Cursando' : formatMonthYear(edu.endDate)}</span>
                </div>
                <div style="font-size: 12px; color: #666;">${edu.institution}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function generateMinimalPDFContent() {
  const { personalInfo, summary, experiences, education, languages, skills } = resumeData;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1a1a1a;">
      <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
        <h1 style="font-size: 28px; font-weight: 300; color: #1a1a1a; margin-bottom: 15px; letter-spacing: 3px; text-transform: uppercase;">
          ${personalInfo.fullName}
        </h1>
        ${personalInfo.birthDate ? `<div style="font-size: 11px; color: #999; margin-bottom: 10px;">📅 ${formatDate(personalInfo.birthDate)}</div>` : ''}
        <div style="font-size: 11px; color: #666; letter-spacing: 1px;">
          ${[personalInfo.phone, personalInfo.email, personalInfo.linkedin].filter(Boolean).join(' • ')}
        </div>
      </div>

      ${summary ? `
        <div style="margin-bottom: 35px;">
          <p style="font-size: 13px; color: #444; line-height: 1.8; text-align: justify;">${summary}</p>
        </div>
      ` : ''}

      ${experiences.length > 0 ? `
        <div style="margin-bottom: 35px;">
          <h2 style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #1a1a1a; margin-bottom: 20px; font-weight: 600;">Experiência</h2>
          ${experiences.map(exp => `
            <div style="margin-bottom: 25px; padding-left: 20px; border-left: 2px solid #e5e7eb;">
              <div style="margin-bottom: 8px;">
                <strong style="font-size: 13px; color: #1a1a1a; font-weight: 600;">${exp.position}</strong>
                <span style="font-size: 11px; color: #999; margin-left: 10px;">${formatMonthYear(exp.startDate)} - ${exp.current ? 'Atual' : formatMonthYear(exp.endDate)}</span>
              </div>
              <div style="font-size: 12px; color: #666; margin-bottom: 8px; font-style: italic;">${exp.company}</div>
              ${exp.description ? `<p style="font-size: 11px; color: #444; line-height: 1.6;">${exp.description}</p>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${education.length > 0 ? `
        <div style="margin-bottom: 35px;">
          <h2 style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #1a1a1a; margin-bottom: 20px; font-weight: 600;">Formação</h2>
          ${education.map(edu => `
            <div style="margin-bottom: 20px; padding-left: 20px; border-left: 2px solid #e5e7eb;">
              <div style="margin-bottom: 5px;">
                <strong style="font-size: 13px; color: #1a1a1a; font-weight: 600;">${edu.degree}</strong>
                <span style="font-size: 11px; color: #999; margin-left: 10px;">${formatMonthYear(edu.startDate)} - ${edu.current ? 'Cursando' : formatMonthYear(edu.endDate)}</span>
              </div>
              <div style="font-size: 12px; color: #666; font-style: italic;">${edu.institution}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        ${languages.length > 0 ? `
          <div>
            <h2 style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #1a1a1a; margin-bottom: 15px; font-weight: 600;">Idiomas</h2>
            <div style="font-size: 12px; color: #444; line-height: 2;">
              ${languages.map(lang => {
    const levelLabel = languageLevels.find(l => l.value === lang.level)?.label || lang.level;
    return `<div style="display: flex; justify-content: space-between;"><span>• ${lang.language}</span><span style="color: #999; font-size: 11px;">${levelLabel}</span></div>`;
  }).join('')}
            </div>
          </div>
        ` : ''}

        ${skills.length > 0 ? `
          <div>
            <h2 style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #1a1a1a; margin-bottom: 15px; font-weight: 600;">Habilidades</h2>
            <div style="font-size: 12px; color: #444; line-height: 2;">
              ${skills.map(skill => `<div>• ${skill}</div>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #999;">
        Criado com SetResume
      </div>
    </div>
  `;
}

function formatMonthYear(monthString) {
  if (!monthString) return '';
  const [year, month] = monthString.split('-');
  const monthKey = `month.${['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][parseInt(month) - 1]}`;
  return `${t(monthKey)} ${year}`;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

window.selectTemplate = selectTemplate;
window.nextStep = nextStep;
window.previousStep = previousStep;
window.addExperience = addExperience;
window.removeExperience = removeExperience;
window.toggleEndDate = toggleEndDate;
window.addEducation = addEducation;
window.removeEducation = removeEducation;
window.toggleEduEndDate = toggleEduEndDate;
window.addLanguage = addLanguage;
window.removeLanguage = removeLanguage;
window.addSkill = addSkill;
window.removeSkill = removeSkill;
window.generateSummary = generateSummary;
window.suggestSkills = suggestSkills;
window.finishResume = finishResume;
window.downloadPDF = downloadPDF;