const apiUrl = 'http://192.168.1.5:8080/registros';

document.addEventListener('DOMContentLoaded', () => {
    const btnAdicionar = document.getElementById('btnAdicionar');
    const formAdicionar = document.getElementById('formAdicionar');
    const btnEnviar = document.getElementById('btnEnviar');
    const btnCancelar = document.getElementById('btnCancelar');
    const modal = document.getElementById('modal');

    const ordem = document.getElementById('id');
    const status = document.getElementById('status');

    status.addEventListener('change', buscarComFiltros);
    ordem.addEventListener('change', buscarComFiltros);

    btnAdicionar.addEventListener('click', () => {
        modal.style.display = 'flex'; // mostra o modal
    });

    btnCancelar.addEventListener('click', () => {
        modal.style.display = 'none'; // esconde o modal
        limparFormulario();
    });

    btnEnviar.addEventListener('click', async () => {
        btnEnviar.disabled = true;

        const novoRegistro = {
            codigo: document.getElementById('codigoInput').value.trim().toUpperCase(),
            nome: document.getElementById('nomeInput').value.trim().toUpperCase(),
            df: document.getElementById('dfInput').value.trim().toUpperCase(),
            descricao: document.getElementById('descricaoInput').value.trim().toUpperCase(),
            responsavel: document.getElementById('responsavelInput').value.trim().toUpperCase()
        };

        if (!novoRegistro.codigo || !novoRegistro.nome) {
            alert('Preencha ao menos Código e Nome.');
            btnEnviar.disabled = false;
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoRegistro)
            });

            if (!response.ok) throw new Error('Falha ao adicionar registro');

            alert('Registro adicionado com sucesso!');
            limparFormulario();
            buscarComFiltros();
            modal.style.display = 'none';
        } catch (error) {
            console.error('Erro ao adicionar registro:', error);
            alert('Erro ao adicionar registro. Tente novamente.');
        } finally {
            btnEnviar.disabled = false;
        }
    });

    buscarComFiltros();
});

function buscar() {
    let termo = document.getElementById("pesquisa").value.trim();

    if (termo === "") {
        alert("Digite algo para buscar.");
        return;
    }

    termo = termo.toUpperCase();

    fetch(`${apiUrl}/search?termo=${encodeURIComponent(termo)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Erro ao buscar registros");
            }
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                alert("Nenhum registro encontrado.");
            }
            displayRegistros(data);
        })
        .catch(error => {
            console.error("Erro:", error);
            alert("Erro ao buscar registros");
        });
}

window.buscar = buscar;

function limparFormulario() {
    document.getElementById('codigoInput').value = '';
    document.getElementById('nomeInput').value = '';
    document.getElementById('dfInput').value = '';
    document.getElementById('descricaoInput').value = '';
    document.getElementById('responsavelInput').value = '';
}

async function buscarComFiltros() {
    const statusSelecionado = document.getElementById('status').value;
    const ordemSelecionada = document.getElementById('id').value;

    const registrosBuscados = document.getElementById('registros');
    registrosBuscados.innerHTML = `
        <tr>
            <td colspan="10" style="text-align: center;">🔄 Carregando registros...</td>
        </tr>
    `;

    try {
        const response = await fetch(`${apiUrl}/findAll`);
        if (!response.ok) throw new Error('Falha ao consumir dados');
        let registros = await response.json();

        if (statusSelecionado.toLowerCase() !== 'todos') {
            registros = registros.filter(reg => reg.status.toLowerCase() === statusSelecionado.toLowerCase());
        }

        if (ordemSelecionada.toLowerCase() === 'recentes') {
            registros.sort((a, b) => b.id - a.id);
        }

        displayRegistros(registros);
    } catch (error) {
        console.error('Erro ao buscar registros:', error);
        registrosBuscados.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; color: red;">❌ Erro ao carregar registros.</td>
            </tr>
        `;
    }
}

function formatarData(dataString) {
    if (!dataString) return '---';
    const data = new Date(dataString);
    if (isNaN(data)) return '---';
    return data.toLocaleDateString('pt-BR');
}

function criarLinhaRegistro(registro) {
    const listItem = document.createElement('tr');
    listItem.classList.add(`status-${registro.status.replace(' ', '_')}`);

    const idTD = document.createElement('td');
    idTD.textContent = registro.id;

    const statusTD = document.createElement('td');
    const select = document.createElement('select');

    const statusList = [
        { label: 'Segregado', value: 'SEGREGADO' },
        { label: 'Em Análise', value: 'EM_ANALISE' },
        { label: 'Concluído', value: 'CONCLUIDO' }
    ];

    statusList.forEach(({ label, value }) => {
        const option = document.createElement('option');
        option.value = value;
        option.text = label;
        if (registro.status === value) option.selected = true;
        select.appendChild(option);
    });

    statusTD.appendChild(select);

    const codigoTD = document.createElement('td');
    codigoTD.textContent = registro.codigo;

    const nomeTD = document.createElement('td');
    nomeTD.textContent = registro.nome;

    const dfTD = document.createElement('td');
    dfTD.textContent = registro.df;

    const descricaoTD = document.createElement('td');
    descricaoTD.textContent = registro.descricao;

    const responsavelTD = document.createElement('td');
    responsavelTD.textContent = registro.responsavel;

    const dataRegistroTD = document.createElement('td');
    dataRegistroTD.textContent = formatarData(registro.dataRegistro);

    const dataSaidaTD = document.createElement('td');
    dataSaidaTD.textContent = formatarData(registro.dataSaida);

    const acoesTD = document.createElement('td');
    const btnDelete = document.createElement('button');
    btnDelete.classList.add('btn-delete');
    btnDelete.textContent = 'Excluir';

    btnDelete.onclick = () => deletarRegistro(registro.id);
    acoesTD.appendChild(btnDelete);

    select.addEventListener('change', async () => {
        const novoStatus = select.value;
        try {
            const response = await fetch(`${apiUrl}/alterarStatus/${registro.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: novoStatus })
            });

            if (!response.ok) throw new Error('Falha ao atualizar status');

            const registroAtualizado = await response.json();
            atualizarLinhaRegistro(listItem, registroAtualizado);
            alert('✅ Status atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('❌ Erro ao tentar atualizar status.');
        }
    });

    listItem.appendChild(idTD);
    listItem.appendChild(statusTD);
    listItem.appendChild(codigoTD);
    listItem.appendChild(nomeTD);
    listItem.appendChild(dfTD);
    listItem.appendChild(descricaoTD);
    listItem.appendChild(responsavelTD);
    listItem.appendChild(dataRegistroTD);
    listItem.appendChild(dataSaidaTD);
    listItem.appendChild(acoesTD);

    return listItem;
}

function atualizarLinhaRegistro(tr, registro) {
    tr.className = '';
    tr.classList.add(`status-${registro.status.replace(' ', '_')}`);

    const tds = tr.querySelectorAll('td');
    tds[0].textContent = registro.id;
    const select = tds[1].querySelector('select');
    if (select) select.value = registro.status;
    tds[2].textContent = registro.codigo;
    tds[3].textContent = registro.nome;
    tds[4].textContent = registro.df;
    tds[5].textContent = registro.descricao;
    tds[6].textContent = registro.responsavel;
    tds[7].textContent = formatarData(registro.dataRegistro);
    tds[8].textContent = formatarData(registro.dataSaida);
}

async function deletarRegistro(id) {
    if (!confirm(`Tem certeza que deseja excluir o registro ${id}?`)) return;

    try {
        const response = await fetch(`${apiUrl}/delete/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erro ao deletar o registro');

        alert(`Registro ${id} excluído com sucesso!`);
        buscarComFiltros();
    } catch (error) {
        console.error('Erro ao deletar registro:', error);
        alert('Não foi possível excluir o registro. Tente novamente.');
    }
}

function displayRegistros(registros) {
    const registrosBuscados = document.getElementById('registros');
    registrosBuscados.innerHTML = '';

    registros.forEach(registro => {
        const linha = criarLinhaRegistro(registro);
        registrosBuscados.appendChild(linha);
    });
}
