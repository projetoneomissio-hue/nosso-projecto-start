import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { format } from "date-fns";

// Register fonts if needed
Font.register({
    family: 'Open Sans',
    src: 'https://fonts.gstatic.com/s/opensans/v17/mem8YaGs126MiZpBA-UFVZ0e.ttf'
});

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: "Helvetica",
        fontSize: 10,
        color: "#333",
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        paddingBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#EA384C",
    },
    headerSubtitle: {
        fontSize: 10,
        color: "#666",
        marginTop: 4,
    },
    turmaInfo: {
        marginBottom: 15,
        backgroundColor: "#F3F4F6",
        padding: 10,
        borderRadius: 4,
    },
    infoText: {
        fontSize: 10,
        marginBottom: 2,
        color: "#374151",
    },
    table: {
        width: "100%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 10,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        minHeight: 24,
        alignItems: "center",
    },
    tableHeader: {
        backgroundColor: "#F9FAFB",
        fontWeight: "bold",
    },
    tableCell: {
        padding: 5,
        fontSize: 9,
    },
    colOrd: { width: "8%", textAlign: "center" },
    colNome: { width: "35%" },
    colCpf: { width: "17%" },
    colResp: { width: "25%" },
    colStatus: { width: "15%", textAlign: "center" },

    statusActive: { color: "#16A34A", fontWeight: "bold" },
    statusPending: { color: "#CA8A04", fontWeight: "bold" },
    statusInactive: { color: "#DC2626" },

    footer: {
        position: "absolute",
        bottom: 30,
        left: 30,
        right: 30,
        fontSize: 8,
        color: "#9CA3AF",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        paddingTop: 10,
        textAlign: "center",
    },
});

interface Aluno {
    nome: string;
    cpf?: string | null;
    responsavel?: string;
    status: string;
    dataMatricula: string;
}

interface ListaAlunosProps {
    turma: {
        nome: string;
        dias: string[];
        horario: string;
        professor: string;
    };
    alunos: Aluno[];
}

export const ListaAlunosPDF = ({ turma, alunos }: ListaAlunosProps) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Lista de Alunos</Text>
                        <Text style={styles.headerSubtitle}>NeoMissio - Controle de Turmas</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 8, color: "#999" }}>
                            Gerado em: {format(new Date(), "dd/MM/yyyy HH:mm")}
                        </Text>
                    </View>
                </View>

                {/* Turma Info */}
                <View style={styles.turmaInfo}>
                    <Text style={[styles.infoText, { fontWeight: "bold", fontSize: 12 }]}>{turma.nome}</Text>
                    <Text style={styles.infoText}>Dias: {turma.dias.join(", ")}</Text>
                    <Text style={styles.infoText}>Horário: {turma.horario}</Text>
                    <Text style={styles.infoText}>Professor: {turma.professor || "Não informado"}</Text>
                    <Text style={[styles.infoText, { marginTop: 4 }]}>Total de Alunos: {alunos.length}</Text>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCell, styles.colOrd]}>#</Text>
                        <Text style={[styles.tableCell, styles.colNome]}>Nome do Aluno</Text>
                        <Text style={[styles.tableCell, styles.colCpf]}>CPF</Text>
                        <Text style={[styles.tableCell, styles.colResp]}>Responsável</Text>
                        <Text style={[styles.tableCell, styles.colStatus]}>Status</Text>
                    </View>
                    {alunos.map((aluno, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.colOrd]}>{index + 1}</Text>
                            <Text style={[styles.tableCell, styles.colNome]}>{aluno.nome}</Text>
                            <Text style={[styles.tableCell, styles.colCpf]}>{aluno.cpf || "-"}</Text>
                            <Text style={[styles.tableCell, styles.colResp]}>{aluno.responsavel || "-"}</Text>
                            <Text style={[
                                styles.tableCell,
                                styles.colStatus,
                                aluno.status === 'ativa' ? styles.statusActive :
                                    aluno.status === 'pendente' ? styles.statusPending : styles.statusInactive
                            ]}>
                                {aluno.status.toUpperCase()}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Lista de frequência gerada automaticamente pelo sistema NeoMissio.
                </Text>
            </Page>
        </Document>
    );
};
