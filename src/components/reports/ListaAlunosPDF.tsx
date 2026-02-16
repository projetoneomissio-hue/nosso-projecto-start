import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { format } from "date-fns";

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: "#333",
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#6D28D9", // Primary Purple
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1F2937",
    },
    subtitle: {
        fontSize: 10,
        color: "#6B7280",
        marginTop: 4,
    },
    infoContainer: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: "#F9FAFB",
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: "#6D28D9",
    },
    infoText: {
        fontSize: 10,
        marginBottom: 4,
        color: "#374151",
    },
    table: {
        display: "flex",
        width: "auto",
        marginTop: 10,
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "#E5E7EB",
        minHeight: 25,
        alignItems: "center",
    },
    tableHeader: {
        backgroundColor: "#F9FAFB",
        fontWeight: "bold",
        color: "#111827",
    },
    colNome: { width: "40%", paddingLeft: 8 },
    colNasc: { width: "20%", paddingLeft: 8 },
    colResp: { width: "25%", paddingLeft: 8 },
    colStatus: { width: "15%", textAlign: "right", paddingRight: 8 },
    cellText: {
        padding: 4,
        fontSize: 9,
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: "center",
        fontSize: 8,
        color: "#9CA3AF",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        paddingTop: 10,
    },
});

interface ListaAlunosPDFProps {
    turmaNome: string;
    atividadeNome: string;
    alunos: any[];
}

export const ListaAlunosPDF = ({ turmaNome, atividadeNome, alunos }: ListaAlunosPDFProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Lista de Chamada / Alunos</Text>
                    <Text style={styles.subtitle}>Sistema Zafer - Gestão Escolar</Text>
                </View>
                <View>
                    <Text style={{ fontSize: 9 }}>Emissão: {format(new Date(), "dd/MM/yyyy HH:mm")}</Text>
                </View>
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>Turma: {turmaNome}</Text>
                <Text style={styles.infoText}>Atividade: {atividadeNome}</Text>
                <Text style={styles.infoText}>Total de Alunos: {alunos.length}</Text>
                <Text style={styles.infoText}>Data de Emissão: {format(new Date(), "dd/MM/yyyy HH:mm")}</Text>
            </View>

            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <View style={styles.colNome}><Text style={styles.cellText}>Nome do Aluno</Text></View>
                    <View style={styles.colNasc}><Text style={styles.cellText}>Nascimento</Text></View>
                    <View style={styles.colResp}><Text style={styles.cellText}>Responsável</Text></View>
                    <View style={styles.colStatus}><Text style={styles.cellText}>Status</Text></View>
                </View>

                {alunos.map((aluno, index) => (
                    <View key={index} style={styles.tableRow}>
                        <View style={styles.colNome}>
                            <Text style={styles.cellText}>{aluno.nome_completo}</Text>
                        </View>
                        <View style={styles.colNasc}>
                            <Text style={styles.cellText}>
                                {aluno.data_nascimento ? format(new Date(aluno.data_nascimento), "dd/MM/yyyy") : "-"}
                            </Text>
                        </View>
                        <View style={styles.colResp}>
                            <Text style={styles.cellText}>{aluno.responsavel_nome || "-"}</Text>
                        </View>
                        <View style={styles.colStatus}>
                            <Text style={styles.cellText}>{aluno.status_matricula || "Ativa"}</Text>
                        </View>
                    </View>
                ))}
            </View>

            <Text style={styles.footer}>
                Zafer Gestão Escolar - Documento de controle interno para coordenação e professores.
            </Text>
        </Page>
    </Document>
);
