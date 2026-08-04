function checkAuth() {
  const session = localStorage.getItem('setresume_session');
  
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  
  return JSON.parse(session);
}

function loadUserInfo() {
  const session = checkAuth();
  if (!session) return;
  
  const firstName = session.name.split(' ')[0];
  document.getElementById('saudacaoNome').textContent = firstName;
  document.getElementById('ddNome').textContent = session.name;
  
  const initials = session.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  
  document.getElementById('navAvatar').textContent = initials;
  document.getElementById('dropdownAvatar').textContent = initials;
  
  const users = JSON.parse(localStorage.getItem('setresume_users')) || [];
  const user = users.find(u => u.id === session.id);
  
  if (user && user.profileImage) {
    document.getElementById('navAvatar').innerHTML = `<img src="${user.profileImage}" alt="Perfil">`;
    document.getElementById('dropdownAvatar').innerHTML = `<img src="${user.profileImage}" alt="Perfil">`;
  }
}

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  
  if (confirm('Tem certeza que deseja sair?')) {
    localStorage.removeItem('setresume_session');
    window.location.href = 'login.html';
  }
});

function loadResumes() {
  const session = checkAuth();
  if (!session) return;
  
  const allResumes = JSON.parse(localStorage.getItem('setresume_resumes')) || [];
  
  const userResumes = allResumes.filter(r => r.userId === session.id);
  
  userResumes.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
  
  updateStats(userResumes);
  
  updateHighlights(userResumes);
  
  renderResumes(userResumes.slice(0, 6));
}

function updateStats(resumes) {
  const totalResumes = resumes.length;
  const totalViews = resumes.reduce((sum, r) => sum + (r.views || 0), 0);
  const totalLikes = resumes.reduce((sum, r) => sum + (r.likes || 0), 0);
  const totalFavorites = resumes.filter(r => r.isFavorite).length;
  
  animateCounter('stat-total', totalResumes);
  animateCounter('stat-views', totalViews);
  animateCounter('stat-likes', totalLikes);
  animateCounter('stat-favoritos', totalFavorites);
}

function animateCounter(elementId, targetValue) {
  const element = document.getElementById(elementId);
  const duration = 1000;
  const steps = 30;
  const increment = targetValue / steps;
  let current = 0;
  let step = 0;
  
  const timer = setInterval(() => {
    step++;
    current = Math.min(Math.round(increment * step), targetValue);
    element.textContent = current;
    
    if (step >= steps) {
      clearInterval(timer);
      element.textContent = targetValue;
    }
  }, duration / steps);
}

function updateHighlights(resumes) {
  if (resumes.length === 0) {
    document.getElementById('destaque-curtido').textContent = '—';
    document.getElementById('destaque-visualizado').textContent = '—';
    document.getElementById('destaque-recente').textContent = '—';
    return;
  }
  
  const maisCurtido = [...resumes].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0];
  document.getElementById('destaque-curtido').textContent = 
    maisCurtido.title || 'Currículo sem título';
  
  const maisVisualizado = [...resumes].sort((a, b) => (b.views || 0) - (a.views || 0))[0];
  document.getElementById('destaque-visualizado').textContent = 
    maisVisualizado.title || 'Currículo sem título';
  
  const maisRecente = [...resumes].sort((a, b) => 
    new Date(b.updatedAt) - new Date(a.updatedAt)
  )[0];
  document.getElementById('destaque-recente').textContent = 
    maisRecente.title || 'Currículo sem título';
}

function renderResumes(resumes) {
  const grid = document.getElementById('grade-curriculos');
  
  if (resumes.length === 0) {
    grid.innerHTML = `
      <div class="estado-vazio">
        <i class="bi bi-file-earmark-text"></i>
        <p>Nenhum currículo criado ainda</p>
        <a href="criar-curriculo.html" class="btn btn-primario" style="margin-top: 20px;">
          <i class="bi bi-plus-lg"></i> Criar Primeiro Currículo
        </a>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = resumes.map(resume => {
    const gradientColors = getGradientForTemplate(resume.template);
    
    return `
      <div class="cartao-curriculo" onclick="editResume('${resume.id}')">
        <div class="miniatura-curriculo" style="background: ${gradientColors}">
          <span>${resume.personalInfo.fullName || 'Sem nome'}</span>
          <i class="bi ${resume.isFavorite ? 'bi-star-fill' : 'bi-star'} miniatura-favorito" 
             onclick="event.stopPropagation(); toggleFavorite('${resume.id}')"></i>
        </div>
        <div class="info-curriculo">
          <h4>${resume.title || 'Currículo sem título'}</h4>
          <p>Atualizado em ${formatDate(resume.updatedAt)}</p>
          <div class="acoes-curriculo">
            <a href="criar-curriculo.html?id=${resume.id}" class="btn-icone" onclick="event.stopPropagation()">
              <i class="bi bi-pencil"></i> Editar
            </a>
            <button class="btn-icone" onclick="event.stopPropagation(); downloadResume('${resume.id}')">
              <i class="bi bi-download"></i> Baixar
            </button>
            <button class="btn-icone btn-icone-excluir" onclick="event.stopPropagation(); deleteResume('${resume.id}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getGradientForTemplate(template) {
  switch (template) {
    case 'modern':
      return 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
    case 'minimal':
      return 'linear-gradient(135deg, #334155 0%, #64748b 100%)';
    case 'classic':
    default:
      return 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)';
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  
  return date.toLocaleDateString('pt-BR');
}

function toggleFavorite(resumeId) {
  const resumes = JSON.parse(localStorage.getItem('setresume_resumes')) || [];
  const resumeIndex = resumes.findIndex(r => r.id === resumeId);
  
  if (resumeIndex !== -1) {
    resumes[resumeIndex].isFavorite = !resumes[resumeIndex].isFavorite;
    localStorage.setItem('setresume_resumes', JSON.stringify(resumes));
    loadResumes();
  }
}

function editResume(resumeId) {
  window.location.href = `criar-curriculo.html?id=${resumeId}`;
}

async function downloadResume(resumeId) {
  const resumes = JSON.parse(localStorage.getItem('setresume_resumes')) || [];
  const resume = resumes.find(r => r.id === resumeId);
  
  if (!resume) {
    alert('Currículo não encontrado!');
    return;
  }

  try {
    const pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'absolute';
    pdfContainer.style.left = '-9999px';
    pdfContainer.style.width = '210mm';
    pdfContainer.style.background = 'white';
    pdfContainer.style.padding = '20mm';
    pdfContainer.style.fontFamily = 'Arial, sans-serif';
    document.body.appendChild(pdfContainer);

    pdfContainer.innerHTML = generatePDFContentFromData(resume);

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

    const fileName = resume.title 
      ? `${resume.title.replace(/[^a-z0-9]/gi, '_')}.pdf`
      : `Curriculo.pdf`;

    pdf.save(fileName);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Tente novamente.');
  }
}

function generatePDFContentFromData(resumeData) {
  const { personalInfo, summary, experiences, education, languages, skills } = resumeData;

  const formatMonthYear = (monthString) => {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  switch (resumeData.template) {
    case 'modern':
      return generateModernPDFTemplate(resumeData, formatMonthYear);
    case 'minimal':
      return generateMinimalPDFTemplate(resumeData, formatMonthYear);
    case 'classic':
    default:
      return generateClassicPDFTemplate(resumeData, formatMonthYear);
  }
}

function generateClassicPDFTemplate(resumeData, formatMonthYear) {
  const { personalInfo, summary, experiences, education, languages, skills } = resumeData;
  
  return `
    <div style="font-family: Arial, sans-serif; color: #1a1a1a; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1e3a8a;">
        <h1 style="font-size: 32px; color: #1e3a8a; margin: 0 0 10px 0; font-weight: 700;">
          ${personalInfo.fullName}
        </h1>
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
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${languages.map(lang => `
                  <span style="display: inline-block; padding: 5px 12px; background: #1e3a8a; color: white; border-radius: 12px; font-size: 11px;">
                    ${lang}
                  </span>
                `).join('')}
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

function generateModernPDFTemplate(resumeData, formatMonthYear) {
  const { personalInfo, summary, experiences, education, languages, skills } = resumeData;

  return `
    <div style="font-family: Arial, sans-serif; display: grid; grid-template-columns: 200px 1fr; gap: 0; min-height: 100%;">
      <div style="background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%); padding: 30px 20px; color: white;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 80px; height: 80px; background: rgba(251, 191, 36, 0.2); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; border: 3px solid #fbbf24;">
            ${personalInfo.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
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
            ${languages.map(lang => `<p style="font-size: 11px; margin-bottom: 6px;">• ${lang}</p>`).join('')}
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

function generateMinimalPDFTemplate(resumeData, formatMonthYear) {
  const { personalInfo, summary, experiences, education, languages, skills } = resumeData;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1a1a1a;">
      <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
        <h1 style="font-size: 28px; font-weight: 300; color: #1a1a1a; margin-bottom: 15px; letter-spacing: 3px; text-transform: uppercase;">
          ${personalInfo.fullName}
        </h1>
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
              ${languages.map(lang => `<div>• ${lang}</div>`).join('')}
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

function deleteResume(resumeId) {
  if (!confirm('Tem certeza que deseja excluir este currículo? Esta ação não pode ser desfeita.')) {
    return;
  }
  
  let resumes = JSON.parse(localStorage.getItem('setresume_resumes')) || [];
  resumes = resumes.filter(r => r.id !== resumeId);
  localStorage.setItem('setresume_resumes', JSON.stringify(resumes));
  
  loadResumes();
}

document.addEventListener('DOMContentLoaded', () => {
  loadUserInfo();
  loadResumes();
});