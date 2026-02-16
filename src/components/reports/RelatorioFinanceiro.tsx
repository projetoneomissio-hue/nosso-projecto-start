
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Estilos do PDF
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 12,
        fontFamily: 'Helvetica',
        color: '#333',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#6D28D9', // Cor primária do sistema
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    subtitle: {
        fontSize: 10,
        color: '#6B7280',
        marginTop: 4,
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1,
    },
    table: {
        width: "100%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        marginBottom: 20,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "#e5e7eb",
        height: 24,
        alignItems: 'center',
    },
    tableHeader: {
        backgroundColor: "#f9fafb",
        fontWeight: "bold",
    },
    tableCell: {
        margin: "auto",
        fontSize: 9,
        padding: 4,
    },
    col1: { width: "15%" }, // Data
    col2: { width: "35%", textAlign: 'left' }, // Descrição
    col3: { width: "20%" }, // Categoria
    col4: { width: "15%", textAlign: 'right' }, // Valor
    col5: { width: "15%", textAlign: 'center' }, // Status

    footer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 8,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 8,
        backgroundColor: '#F3F4F6',
        fontWeight: 'bold',
    },
});

interface Transacao {
    id: string;
    descricao: string;
    valor: number;
    tipo: 'receita' | 'despesa';
    data_vencimento: string;
    categoria: string;
    status: 'pago' | 'pendente' | 'vencido';
}

interface RelatorioFinanceiroProps {
    transacoes: Transacao[];
    periodo?: string;
    tipo: 'receita' | 'despesa' | 'geral';
}

export const RelatorioFinanceiro = ({ transacoes, periodo = "Mensal", tipo }: RelatorioFinanceiroProps) => {
    const total = transacoes.reduce((acc, curr) => {
        const valor = Number(curr.valor);
        return curr.tipo === 'receita' ? acc + valor : acc - valor;
    }, 0);

    const title = tipo === 'receita' ? 'Relatório de Receitas' : tipo === 'despesa' ? 'Relatório de Despesas' : 'Relatório Financeiro Geral';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.subtitle}>Sistema de Gestão Escolar Zafer</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 10 }}>Emissão: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</Text>
                        <Text style={{ fontSize: 10 }}>Período: {periodo}</Text>
                    </View>
                </View>

                {/* Tabela */}
                <View style={styles.table}>
                    {/* Cabeçalho da Tabela */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCell, styles.col1]}>Data</Text>
                        <Text style={[styles.tableCell, styles.col2]}>Descrição</Text>
                        <Text style={[styles.tableCell, styles.col3]}>Categoria</Text>
                        <Text style={[styles.tableCell, styles.col4]}>Valor</Text>
                        <Text style={[styles.tableCell, styles.col5]}>Status</Text>
                    </View>

                    {/* Dados */}
                    {transacoes.map((item) => (
                        <View style={styles.tableRow} key={item.id}>
                            <Text style={[styles.tableCell, styles.col1]}>
                                {format(new Date(item.data_vencimento), 'dd/MM/yyyy')}
                            </Text>
                            <Text style={[styles.tableCell, styles.col2]}>{item.descricao}</Text>
                            <Text style={[styles.tableCell, styles.col3]}>{item.categoria}</Text>
                            <Text style={[styles.tableCell, styles.col4]}>
                                {Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </Text>
                            <Text style={[styles.tableCell, styles.col5, {
                                color: item.status === 'pago' ? '#059669' : item.status === 'vencido' ? '#DC2626' : '#D97706'
                            }]}>
                                {item.status.toUpperCase()}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Total */}
                <View style={styles.totalRow}>
                    <Text>Saldo Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Documento gerado automaticamente pelo Sistema Zafer.
                </Text>
            </Page>
        </Document>
    );
};
